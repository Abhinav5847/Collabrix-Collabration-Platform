from django.shortcuts import render
from django.contrib.auth import authenticate,get_user_model
from rest_framework.views import APIView
from rest_framework import status
from rest_framework.response import Response
from .serializers import RegisterSerializer,LoginSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User


# Create your views here.

# auth
class RegisterView(APIView):
    def post(self,request):
        try:
            serializer = RegisterSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save()
                return Response({"message":"Registration Completed"},status=status.HTTP_201_CREATED)
            return Response(serializer.errors,status=status.HTTP_400_BAD_REQUEST)
        
        except Exception as e:
            return Response({"Error":str(e)},status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class LoginView(APIView):
    def post(self,request):
        try:
            serializer = LoginSerializer(data=request.data)
            if serializer.is_valid():
                email = serializer.validated_data.get('email')       
                password = serializer.validated_data.get('password')

                user = authenticate(email=email,password=password)

                if user is not None:
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
                           

