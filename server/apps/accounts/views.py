from django.shortcuts import render
from django.contrib.auth import authenticate,get_user_model
from rest_framework.views import APIView
from rest_framework import status
from rest_framework.response import Response
from .serializers import RegisterSerializer,LoginSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User,UserOTP
from .utils.send_otp_email import send_otp_email


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
                           

