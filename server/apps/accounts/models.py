from django.db import models
from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.contrib.auth import get_user_model
from django.utils import timezone
import random
from datetime import timedelta


class User(AbstractUser):
    email = models.EmailField(unique=True)
    # otp = models.CharField(max_length=4, blank=True, null=True) 
    is_verified = models.BooleanField(default=False)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    # def generate_otp(self):
    #     self.otp = f"{random.randint(1000, 9999)}"
    #     self.save()
    #     return self.otp

    def __str__(self):
        return self.email

User = get_user_model()

class UserOTP(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='otps')
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    attempts = models.IntegerField(default=0)

    def increment_attempts(self):
        self.attempts += 1
        self.save()

    def save(self, *args, **kwargs):
        if not self.code:
            self.code = f"{random.randint(1000, 9999)}"
        if not self.expires_at:
            self.expires_at = timezone.now() + timedelta(minutes=5)
        super().save(*args, **kwargs)

    def is_expired(self):
        return timezone.now() > self.expires_at

class UserMFA(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL,on_delete=models.CASCADE)
    secret = models.CharField(max_length=32)
    is_enabled = models.BooleanField(default=False)        