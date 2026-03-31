from django.shortcuts import render
from django.http import HttpResponse
from django.conf import settings
from django.utils.http import urlsafe_base64_encode,urlsafe_base64_decode
from django.contrib.auth.password_validation import validate_password, ValidationError
from django.utils.encoding import force_bytes
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.contrib.auth import authenticate,get_user_model
from rest_framework.views import APIView
from rest_framework import status
from rest_framework.response import Response
from .serializers import RegisterSerializer,LoginSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import IsAuthenticated,AllowAny
from .models import User,UserOTP,UserMFA
from .utils.send_otp_email import send_otp_email
from .utils.send_forgotpass_email import send_forgotpass_email
User = get_user_model()
import os 
import requests
import pyotp,qrcode
from io import BytesIO


# Create your views here.

# auth
class RegisterView(APIView):
    def post(self, request):
        try:
            serializer = RegisterSerializer(data=request.data)
            if serializer.is_valid():
                user = serializer.save()

                try:
                    otp = UserOTP.objects.create(user=user)
                    if not send_otp_email(user.email, otp.code):
                        raise Exception("Failed to send OTP email")
                except Exception as e:
                    return Response(
                        {"error": f"OTP not sent: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
                    )

                return Response(
                    {"message": "Registration completed. Check your email for OTP."},
                    status=status.HTTP_201_CREATED
                )

            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
class VerifyOTPView(APIView):
    def post(self, request):
        email = request.data.get("email")
        otp = request.data.get("otp")

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({"error": "Invalid email"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            otp_obj = user.otps.latest('created_at')

            if otp_obj.is_expired():
                return Response({"error": "OTP expired"}, status=status.HTTP_400_BAD_REQUEST)

            if otp_obj.attempts >= 5:
                return Response({"error": "Too many failed attempts"}, status=status.HTTP_400_BAD_REQUEST)

            if otp_obj.code != otp:
                otp_obj.increment_attempts()  
                return Response({"error": "Invalid OTP"}, status=status.HTTP_400_BAD_REQUEST)

            user.is_verified = True
            user.save()
            otp_obj.delete()  
            return Response({"message": "Email verified successfully"}, status=status.HTTP_200_OK)

        except UserOTP.DoesNotExist:
            return Response({"error": "OTP not found"}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ResendOtpView(APIView):
    def post(self,request):
        email = request.data.get("email")
        if not email:
                return Response({"error": "Email is required"}, status=status.HTTP_400_BAD_REQUEST)            
        try:
            user = User.objects.get(email=email)
            UserOTP.objects.filter(user=user).delete()

            otp = UserOTP.objects.create(user=user)

            if not send_otp_email(user.email,otp.code):
                raise Exception("Failed to send OTP email")
                
            return Response({"message": "OTP resent successfully"}, status=status.HTTP_200_OK)
            
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
            
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class LoginView(APIView):
    def post(self,request):
        try:
            serializer = LoginSerializer(data=request.data)
            if serializer.is_valid():
                email = serializer.validated_data.get('email')       
                password = serializer.validated_data.get('password')

                user = authenticate(request,email=email,password=password)

                if user is not None:
                    if not user.is_verified:
                      return Response({"error": "Email not verified"}, status=status.HTTP_403_FORBIDDEN)
                    
                    if user.is_active:
                     refresh = RefreshToken.for_user(user)
                     return Response({
                            "message": "Login successful",
                            "access": str(refresh.access_token),
                            "refresh": str(refresh)
                        }, status=status.HTTP_200_OK)
                    else:
                     return Response({"error":"User account is inactive"},status=status.HTTP_403_FORBIDDEN)
                
                return Response({"error":"Invalid email or password"},status=status.HTTP_401_UNAUTHORIZED)

            return Response(serializer.errors,status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error":str(e)},status=status.HTTP_500_INTERNAL_SERVER_ERROR)    
                           

class GoogleAuthView(APIView):
    def post(self,request):
        try:
            code = request.data.get("code")
            if not code:
                return Response({"error": "Code is required"}, status=status.HTTP_400_BAD_REQUEST)
            try:
                token_url = "https://oauth2.googleapis.com/token"
                data = {
                    "code": code,
                    "client_id": os.getenv("GOOGLE_CLIENT_ID"),
                    "client_secret": os.getenv("GOOGLE_CLIENT_SECRET"),
                    "redirect_uri": "http://localhost:5173/google/callback",
                    "grant_type": "authorization_code"
                }
                token_res = requests.post(token_url,data=data)
                token_res.raise_for_status()
                token_data = token_res.json()
                access_token = token_data.get("access_token")
            except requests.exceptions.RequestException as e:
                return Response({"error": f"Failed to get token from Google: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)
            try:
                user_info_url = "https://www.googleapis.com/oauth2/v2/userinfo"
                user_res = requests.get(user_info_url, headers={"Authorization": f"Bearer {access_token}"})
                user_res.raise_for_status()
                user_data = user_res.json()
                email = user_data.get("email")
                name = user_data.get("name")
                picture = user_data.get("picture")
            except requests.exceptions.RequestException as e:
                return Response({"error": f"Failed to get user info from Google: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)
            try:
                user, created = User.objects.get_or_create(
                    email=email,
                    defaults={
                        "username": email,
                        "first_name": name,
                        "is_verified": True  
                    }
                )
            except Exception as e:
                return Response({"error": f"Failed to create/get user: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            try:
                refresh = RefreshToken.for_user(user)
                return Response({
                    "refresh": str(refresh),
                    "access": str(refresh.access_token),
                    "user": {
                        "email": email,
                        "name": name,
                        "picture": picture
                    }
                }, status=status.HTTP_200_OK)
            except Exception as e:
                return Response({"error": f"Failed to generate JWT: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        except Exception as e:
            return Response({"error": f"An unexpected error occurred: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class EnableMfaView(APIView):
    permission_classes = [IsAuthenticated] 

    def get(self,request):
        secret = pyotp.random_base32()

        mfa,_ = UserMFA.objects.get_or_create(user=request.user)
        mfa.secret = secret
        mfa.is_enabled = False
        mfa.save()  

        uri = pyotp.TOTP(secret).provisioning_uri(
            name=request.user.email,
            issuer_name="Collabrix"
        )

        qr = qrcode.make(uri)
        buffer = BytesIO()
        qr.save(buffer)

        return HttpResponse(buffer.getvalue(), content_type="image/png")

class VerifyMFAView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        code = request.data.get("code")

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
    def post(self,request):
        email = request.data.get('email')

        if not email:
            return Response({"error":"Email required"},status=status.HTTP_400_BAD_REQUEST)
        try:
            user = User.objects.get(email=email)
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)

            reset_link = f"{settings.FRONTEND_URL}/reset_password/{uid}/{token}/"

            send_forgotpass_email(user.email, reset_link)
                   
        except User.DoesNotExist:
            pass

        return Response(
            {"message": "If the email exists, a reset link has been sent"},
            status=status.HTTP_200_OK
        )
        
class ResetPassView(APIView):
    def post(self,request,uidb64,token):
        password = request.data.get('password')

        if not password:
            return Response({"error":"Password Required"},status=status.HTTP_400_BAD_REQUEST)

        try:
          uid = urlsafe_base64_decode(uidb64).decode()
          user = User.objects.get(pk=uid)
          if not default_token_generator.check_token(user,token):
              return Response({"error":"Invalid or expired token"},status=status.HTTP_400_BAD_REQUEST)
          
          try:
            validate_password(password, user)
          except ValidationError as e:
            return Response({"error": e.messages}, status=status.HTTP_400_BAD_REQUEST)
          
          user.set_password(password)
          user.save()

          return Response({"message":"Password reset successful"},status=status.HTTP_200_OK)
        
        except Exception as e:
            return Response({"error": "Invalid request"}, status=status.HTTP_400_BAD_REQUEST)


