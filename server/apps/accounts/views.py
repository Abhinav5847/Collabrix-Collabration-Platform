from django.shortcuts import render
from django.contrib.auth import authenticate,get_user_model
from rest_framework.views import APIView
from rest_framework import status
from rest_framework.response import Response
from .serializers import RegisterSerializer,LoginSerializer
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

                try:
                    user = User.objects.get(email=email)
                except User.DoesNotExist:
                    return Response({"error":"Invalid email or password"},status=status.HTTP_401_UNAUTHORIZED)
                
                if user.check_password(password):
                    return Response({"message":"Login successfull"},status=status.HTTP_200_OK)
                else:
                    return Response({"message":"Invalid email or password"},status=status.HTTP_401_UNAUTHORIZED)

            return Response(serializer.errors,status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error":str(e)},status=status.HTTP_500_INTERNAL_SERVER_ERROR)    
                           

