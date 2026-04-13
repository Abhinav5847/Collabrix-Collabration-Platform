from django.conf import settings
from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.password_validation import ValidationError, validate_password
from django.contrib.auth.tokens import default_token_generator
from django.http import HttpResponse
from django.shortcuts import render
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from rest_framework import status
from rest_framework.exceptions import ValidationError as DRFValidationError
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.tokens import RefreshToken

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

User = get_user_model()
import os
from io import BytesIO

import pyotp
import qrcode
import requests

# Create your views here.

# auth


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
                return Response(
                    {"error": f"OTP not sent: {str(e)}"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

            return Response(
                {"message": "Registration completed. Check your email for OTP."},
                status=status.HTTP_201_CREATED,
            )

        except DRFValidationError as e:
            return Response({"error": e.detail}, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            return Response(
                {"error": "Something went wrong"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


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

            if otp_obj.is_expired():
                return Response({"error": "OTP expired"}, status=400)

            if otp_obj.attempts >= 5:
                return Response({"error": "Too many failed attempts"}, status=400)

            if otp_obj.code != otp:
                otp_obj.increment_attempts()
                return Response({"error": "Invalid OTP"}, status=400)

            user.is_verified = True
            user.save()
            otp_obj.delete()

            return Response({"message": "Email verified successfully"}, status=200)

        except DRFValidationError as e:
            return Response({"error": e.detail}, status=400)

        except User.DoesNotExist:
            return Response({"error": "Invalid email"}, status=400)

        except UserOTP.DoesNotExist:
            return Response({"error": "OTP not found"}, status=400)

        except Exception:
            return Response({"error": "Something went wrong"}, status=500)


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

            return Response(
                {"message": "OTP resent successfully"}, status=status.HTTP_200_OK
            )

        except User.DoesNotExist:
            return Response(
                {"error": "User not found"}, status=status.HTTP_404_NOT_FOUND
            )

        except Exception as e:
            return Response(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class LoginView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    serializer_class = LoginSerializer

    def post(self, request):
        try:
            serializer = self.serializer_class(data=request.data)
            serializer.is_valid(raise_exception=True)

            email = serializer.validated_data["email"]
            password = serializer.validated_data["password"]

            user = authenticate(request, email=email, password=password)

            if not user:
                return Response(
                    {"error": "Invalid email or password"},
                    status=status.HTTP_401_UNAUTHORIZED,
                )

            if not user.is_verified:
                return Response(
                    {"error": "Email not verified"}, status=status.HTTP_403_FORBIDDEN
                )

            if not user.is_active:
                return Response(
                    {"error": "User account is inactive"},
                    status=status.HTTP_403_FORBIDDEN,
                )

            refresh = RefreshToken.for_user(user)

            return Response(
                {
                    "message": "Login successful",
                    "access": str(refresh.access_token),
                    "refresh": str(refresh),
                },
                status=status.HTTP_200_OK,
            )

        except DRFValidationError as e:
            return Response({"error": e.detail}, status=status.HTTP_400_BAD_REQUEST)

        except Exception:
            return Response(
                {"error": "Something went wrong"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class GoogleAuthView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    serializer_class = GoogleAuthSerializer

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)

        code = serializer.validated_data.get("code")

        try:
            token_url = "https://oauth2.googleapis.com/token"
            data = {
                "code": code,
                "client_id": os.getenv("GOOGLE_CLIENT_ID"),
                "client_secret": os.getenv("GOOGLE_CLIENT_SECRET"),
                "redirect_uri": "http://localhost:5173/google/callback",
                "grant_type": "authorization_code",
            }
            token_res = requests.post(token_url, data=data)
            token_res.raise_for_status()
            token_data = token_res.json()
            access_token = token_data.get("access_token")
        except requests.exceptions.RequestException as e:
            return Response(
                {"error": f"Failed to get token from Google: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            user_info_url = "https://www.googleapis.com/oauth2/v2/userinfo"
            user_res = requests.get(
                user_info_url, headers={"Authorization": f"Bearer {access_token}"}
            )
            user_res.raise_for_status()
            user_data = user_res.json()
            email = user_data.get("email")
            name = user_data.get("name")
            picture = user_data.get("picture")
        except requests.exceptions.RequestException as e:
            return Response(
                {"error": f"Failed to get user info from Google: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            user, created = User.objects.get_or_create(
                email=email,
                defaults={"username": email, "first_name": name, "is_verified": True},
            )
        except Exception as e:
            return Response(
                {"error": f"Failed to create/get user: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
        try:
            refresh = RefreshToken.for_user(user)
            return Response(
                {
                    "refresh": str(refresh),
                    "access": str(refresh.access_token),
                    "user": {"email": email, "name": name, "picture": picture},
                },
                status=status.HTTP_200_OK,
            )
        except Exception as e:
            return Response(
                {"error": f"Failed to generate JWT: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        except Exception as e:
            return Response(
                {"error": f"An unexpected error occurred: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class EnableMfaView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def get(self, request):
        secret = pyotp.random_base32()

        mfa, _ = UserMFA.objects.get_or_create(user=request.user)
        mfa.secret = secret
        mfa.is_enabled = False
        mfa.save()

        uri = pyotp.TOTP(secret).provisioning_uri(
            name=request.user.email, issuer_name="Collabrix"
        )

        qr = qrcode.make(uri)
        buffer = BytesIO()
        qr.save(buffer)

        return HttpResponse(buffer.getvalue(), content_type="image/png")


class VerifyMFAView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]
    serializer_class = VerifyMFASerializer

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)

        code = serializer.validated_data.get("code")
        try:
            mfa = UserMFA.objects.get(user=request.user)
            totp = pyotp.TOTP(mfa.secret)

            if totp.verify(code):
                mfa.is_enabled = True
                mfa.save()
                return Response({"message": "MFA enabled"})

            return Response({"error": "Invalid code"}, status=400)

        except UserMFA.DoesNotExist:
            return Response({"error": "MFA not setup"}, status=400)


class ForgotPassView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    serializer_class = ForgotPassSerializer

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data.get("email")
        try:
            user = User.objects.get(email=email)
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)

            reset_link = f"{settings.FRONTEND_URL}/reset_password/{uid}/{token}/"

            # print(reset_link)

            send_forgotpass_email(user.email, reset_link)

        except User.DoesNotExist:
            pass

        return Response(
            {"message": "If the email exists, a reset link has been sent"},
            status=status.HTTP_200_OK,
        )


class ResetPassView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    serializer_class = ResetPassSerializer

    def post(self, request, uidb64, token):

        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)

        password = serializer.validated_data.get("password")
        try:
            uid = urlsafe_base64_decode(uidb64).decode()
            user = User.objects.get(pk=uid)
            if not default_token_generator.check_token(user, token):
                return Response(
                    {"error": "Invalid or expired token"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            try:
                validate_password(password, user)
            except ValidationError as e:
                return Response(
                    {"error": e.messages}, status=status.HTTP_400_BAD_REQUEST
                )

            user.set_password(password)
            user.save()

            return Response(
                {"message": "Password reset successful"}, status=status.HTTP_200_OK
            )

        except Exception as e:
            return Response(
                {"error": "Invalid request"}, status=status.HTTP_400_BAD_REQUEST
            )

class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def get(self, request, pk):
        try:
            if str(request.user.pk) != str(pk):
                return Response(
                    {"error": "Permission denied"}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            
            user = User.objects.get(pk=pk)
            return Response({
                "id": user.id,
                "email": user.email,
                "username": user.username,
                "first_name": user.first_name,
                "last_name": user.last_name,
            }, status=status.HTTP_200_OK)
            
        except User.DoesNotExist:
            return Response(
                {"error": "User not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )