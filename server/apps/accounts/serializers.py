from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from rest_framework import serializers
from django.contrib.auth import authenticate,get_user_model
from .models import User, UserMFA

from .models import User


class RegisterSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(required=True)
    username = serializers.CharField(required=True)
    password = serializers.CharField(write_only=True, required=True)
    confirm_password = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ["email", "username", "password", "confirm_password"]

    def validate_password(self, value):
        try:
            validate_password(value)
        except ValidationError as e:
            # Returns a list of strings; React can map these under the password field
            raise serializers.ValidationError(e.messages)
        return value

    def validate(self, data):
        # Field Error: Specifically targets the confirm_password field
        if data["password"] != data["confirm_password"]:
            raise serializers.ValidationError({
                "confirm_password": "Passwords do not match."
            })
        return data

    def create(self, validated_data):
        validated_data.pop("confirm_password")
        return User.objects.create_user(**validated_data)

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(required=True, write_only=True)

    def validate(self, data):
        email = data.get("email")
        password = data.get("password")

        user = authenticate(email=email, password=password)
        
        if not user:

            user_exists = get_user_model().objects.filter(email=email).first()
            if user_exists:
                if user_exists.is_deleted:
                    raise serializers.ValidationError("This account has been deleted.")
                if not user_exists.is_active:
                    raise serializers.ValidationError("Your account has been suspended by an administrator.")
            
            raise serializers.ValidationError("Invalid email or password.")
        
        if not user.is_verified:
            raise serializers.ValidationError({"email": "Your account is not verified."})

        # Final safety check for active status (Django's authenticate() returns None 
        # for inactive users by default anyway, but this is explicit)
        if not user.is_active:
            raise serializers.ValidationError("Your account is currently inactive.")

        data["user"] = user
        return data


class VerifyOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(max_length=6)


class ResendOtpSerializer(serializers.Serializer):
    email = serializers.EmailField()


class GoogleAuthSerializer(serializers.Serializer):
    code = serializers.CharField()


class VerifyMFASerializer(serializers.Serializer):
    code = serializers.CharField()


class ForgotPassSerializer(serializers.Serializer):
    email = serializers.EmailField()


class ResetPassSerializer(serializers.Serializer):
    password = serializers.CharField(write_only=True)

class UserProfileSerializer(serializers.ModelSerializer):

    mfa_enabled = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'email', 'username','mfa_enabled', 'is_verified']

    def get_mfa_enabled(self, obj):
        # Check if a UserMFA record exists and if is_enabled is True
        try:
            return obj.usermfa.is_enabled
        except UserMFA.DoesNotExist:
            return False        
