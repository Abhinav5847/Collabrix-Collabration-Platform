from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from .models import User

class RegisterSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(required=True) 
    password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['email','username','password','confirm_password']

    def validate(self,data):
        if data['password'] != data['confirm_password']:
           raise serializers.ValidationError({
           "confirm_password": "Passwords do not match"
           })
        return data
     
    def validate_password(self, value):
        try:
                validate_password(value)
        except ValidationError as e:
            raise serializers.ValidationError(e.messages)
        return value

    def create(self,validated_data):

        validated_data.pop('confirm_password')

        user = User.objects.create_user(
            email=validated_data['email'],
            username=validated_data['username'],
            password=validated_data['password']
        )
        return user 

class LoginSerializer(serializers.Serializer):
     email = serializers.EmailField(required=True)
     password = serializers.CharField(required=True,write_only=True)

