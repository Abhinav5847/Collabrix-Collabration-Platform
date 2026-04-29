from django.conf import settings
from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.password_validation import ValidationError, validate_password
from django.contrib.auth.tokens import default_token_generator
from django.http import HttpResponse
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from rest_framework import status
from rest_framework.exceptions import ValidationError as DRFValidationError
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView

# Import your custom authentication
from .authenticate import CookieJWTAuthentication

from .models import User, UserMFA, UserOTP
from .serializers import (
    ForgotPassSerializer,
    GoogleAuthSerializer,
    LoginSerializer,
    RegisterSerializer,
    ResendOtpSerializer,
    ResetPassSerializer,
    VerifyMFASerializer,
    VerifyOTPSerializer,
)
from .utils.send_forgotpass_email import send_forgotpass_email
from .utils.send_otp_email import send_otp_email

import os
from io import BytesIO
import pyotp
import qrcode
import requests

User = get_user_model()

# --- Helper Function for Cookie Setting (Keeps views clean) ---
def set_auth_cookies(response, refresh):
    response.set_cookie(
        key=settings.SIMPLE_JWT['AUTH_COOKIE'],
        value=str(refresh.access_token),
        expires=settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'],
        httponly=settings.SIMPLE_JWT['AUTH_COOKIE_HTTP_ONLY'],
        secure=settings.SIMPLE_JWT['AUTH_COOKIE_SECURE'],
        samesite=settings.SIMPLE_JWT['AUTH_COOKIE_SAMESITE'],
        path=settings.SIMPLE_JWT.get('AUTH_COOKIE_PATH', '/'),
    )
    response.set_cookie(
        key=settings.SIMPLE_JWT['AUTH_COOKIE_REFRESH'],
        value=str(refresh),
        expires=settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'],
        httponly=settings.SIMPLE_JWT['AUTH_COOKIE_HTTP_ONLY'],
        secure=settings.SIMPLE_JWT['AUTH_COOKIE_SECURE'],
        samesite=settings.SIMPLE_JWT['AUTH_COOKIE_SAMESITE'],
        path=settings.SIMPLE_JWT.get('AUTH_COOKIE_PATH', '/'),
    )
    return response

# --- Auth Views ---

class RegisterView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    serializer_class = RegisterSerializer

    def post(self, request):
        try:
            serializer = self.serializer_class(data=request.data)
            serializer.is_valid(raise_exception=True)
            user = serializer.save()
            try:
                otp = UserOTP.objects.create(user=user)
                if not send_otp_email(user.email, otp.code):
                    raise Exception("Failed to send OTP email")
            except Exception as e:
                return Response({"error": f"OTP not sent: {str(e)}"}, status=500)
            return Response({"message": "Registration completed. Check your email for OTP."}, status=201)
        except DRFValidationError as e:
            return Response({"error": e.detail}, status=400)
        except Exception:
            return Response({"error": "Something went wrong"}, status=500)

class VerifyOTPView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    serializer_class = VerifyOTPSerializer

    def post(self, request):
        try:
            serializer = self.serializer_class(data=request.data)
            serializer.is_valid(raise_exception=True)
            email = serializer.validated_data["email"]
            otp = serializer.validated_data["otp"]
            user = User.objects.get(email=email)
            otp_obj = user.otps.latest("created_at")

            if otp_obj.is_expired(): return Response({"error": "OTP expired"}, status=400)
            if otp_obj.attempts >= 5: return Response({"error": "Too many failed attempts"}, status=400)
            if otp_obj.code != otp:
                otp_obj.increment_attempts()
                return Response({"error": "Invalid OTP"}, status=400)

            user.is_verified = True
            user.save()
            otp_obj.delete()
            return Response({"message": "Email verified successfully"}, status=200)
        except User.DoesNotExist:
            return Response({"error": "Invalid email"}, status=400)
        except Exception as e:
            return Response({"error": str(e)}, status=400)

class ResendOtpView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    serializer_class = ResendOtpSerializer

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data.get("email")
        try:
            user = User.objects.get(email=email)
            UserOTP.objects.filter(user=user).delete()
            otp = UserOTP.objects.create(user=user)
            if not send_otp_email(user.email, otp.code):
                raise Exception("Failed to send OTP email")
            return Response({"message": "OTP resent successfully"}, status=200)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=404)
        except Exception as e:
            return Response({"error": str(e)}, status=500)

class LoginView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    serializer_class = LoginSerializer

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = authenticate(request, email=serializer.validated_data["email"], password=serializer.validated_data["password"])

        if not user: return Response({"error": "Invalid credentials"}, status=401)
        if not user.is_verified: return Response({"error": "Email not verified"}, status=403)

        refresh = RefreshToken.for_user(user)
        response = Response({"message": "Login successful", "user_id": user.id}, status=200)
        return set_auth_cookies(response, refresh)

class LogoutView(APIView):
    def post(self, request):
        response = Response({"message": "Successfully logged out"}, status=status.HTTP_200_OK)
        
        # Clear the cookies by setting them to expire immediately
        response.delete_cookie(settings.SIMPLE_JWT['AUTH_COOKIE'])
        response.delete_cookie('refresh_token') # Or whatever your refresh cookie name is
        
        # Optional: If you use Django's standard session as well
        from django.contrib.auth import logout
        logout(request)
        
        return response        

class GoogleAuthView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    serializer_class = GoogleAuthSerializer

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        code = serializer.validated_data.get("code")
        try:
            token_res = requests.post("https://oauth2.googleapis.com/token", data={
                "code": code,
                "client_id": os.getenv("GOOGLE_CLIENT_ID"),
                "client_secret": os.getenv("GOOGLE_CLIENT_SECRET"),
                "redirect_uri": "http://localhost:5173/google/callback",
                "grant_type": "authorization_code",
            })
            token_res.raise_for_status()
            user_res = requests.get("https://www.googleapis.com/oauth2/v2/userinfo", 
                                    headers={"Authorization": f"Bearer {token_res.json().get('access_token')}"})
            user_res.raise_for_status()
            data = user_res.json()

            user, _ = User.objects.get_or_create(email=data['email'], defaults={
                "username": data['email'], "first_name": data.get('name', ''), "is_verified": True
            })

            refresh = RefreshToken.for_user(user)
            response = Response({"message": "Google Login Success", "user": data}, status=200)
            return set_auth_cookies(response, refresh)
        except Exception as e:
            return Response({"error": str(e)}, status=400)

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [CookieJWTAuthentication]

    def post(self, request):
        refresh_token = request.COOKIES.get(settings.SIMPLE_JWT['AUTH_COOKIE_REFRESH'])
        if refresh_token:
            try:
                RefreshToken(refresh_token).blacklist()
            except: pass
        
        response = Response({"message": "Logout successful"}, status=200)
        response.delete_cookie(settings.SIMPLE_JWT['AUTH_COOKIE'])
        response.delete_cookie(settings.SIMPLE_JWT['AUTH_COOKIE_REFRESH'])
        return response

class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [CookieJWTAuthentication]

    def get(self, request):
        # The CookieJWTAuthentication identifies the user automatically
        user = request.user
        return Response({
            "id": user.id, 
            "email": user.email, 
            "username": user.username,
            "first_name": user.first_name, 
            "last_name": user.last_name,
        }, status=200)

class EnableMfaView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [CookieJWTAuthentication]

    def get(self, request):
        secret = pyotp.random_base32()
        mfa, _ = UserMFA.objects.get_or_create(user=request.user)
        mfa.secret, mfa.is_enabled = secret, False
        mfa.save()
        uri = pyotp.TOTP(secret).provisioning_uri(name=request.user.email, issuer_name="Collabrix")
        qr = qrcode.make(uri)
        buffer = BytesIO()
        qr.save(buffer)
        return HttpResponse(buffer.getvalue(), content_type="image/png")

class VerifyMFAView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [CookieJWTAuthentication]
    serializer_class = VerifyMFASerializer

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            mfa = UserMFA.objects.get(user=request.user)
            if pyotp.TOTP(mfa.secret).verify(serializer.validated_data["code"]):
                mfa.is_enabled = True
                mfa.save()
                return Response({"message": "MFA enabled"})
            return Response({"error": "Invalid code"}, status=400)
        except UserMFA.DoesNotExist:
            return Response({"error": "MFA not setup"}, status=400)

class SaveFCMTokenView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [CookieJWTAuthentication]

    def post(self, request):
        token = request.data.get('token')
        if token:
            request.user.fcm_token = token
            request.user.save()
            return Response({"status": "Token saved successfully"}, status=200)
        return Response({"error": "No token provided"}, status=400)

class ForgotPassView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    serializer_class = ForgotPassSerializer

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            user = User.objects.get(email=serializer.validated_data["email"])
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)
            reset_link = f"{settings.FRONTEND_URL}/reset_password/{uid}/{token}/"
            send_forgotpass_email(user.email, reset_link)
        except User.DoesNotExist: pass
        return Response({"message": "If the email exists, a reset link has been sent"}, status=200)

class ResetPassView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    serializer_class = ResetPassSerializer

    def post(self, request, uidb64, token):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            uid = urlsafe_base64_decode(uidb64).decode()
            user = User.objects.get(pk=uid)
            if not default_token_generator.check_token(user, token):
                return Response({"error": "Invalid token"}, status=400)
            validate_password(serializer.validated_data["password"], user)
            user.set_password(serializer.validated_data["password"])
            user.save()
            return Response({"message": "Password reset successful"}, status=200)
        except Exception:
            return Response({"error": "Invalid request"}, status=400)

class CookieTokenRefreshView(TokenRefreshView):
    def post(self, request, *args, **kwargs):
        # Pull from cookie instead of body
        refresh_token = request.COOKIES.get(settings.SIMPLE_JWT['AUTH_COOKIE_REFRESH'])
        if refresh_token:
            request.data['refresh'] = refresh_token
        
        response = super().post(request, *args, **kwargs)
        
        if response.status_code == 200:
            # Re-set the access cookie with the new token
            response.set_cookie(
                key=settings.SIMPLE_JWT['AUTH_COOKIE'],
                value=response.data.get('access'),
                httponly=True,
                samesite='Lax'
            )
            del response.data['access'] # Clean the body
        return response            