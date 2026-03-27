from rest_framework import serializers
from .models import User

class RegisterSerializer(serializers.ModelSerializer):

    password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['email','username','password','confirm_password']

    def validate(self,data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError("passwords do not match")
        return data

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

