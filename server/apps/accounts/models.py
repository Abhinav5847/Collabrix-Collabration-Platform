from django.db import models
from django.contrib.auth.models import AbstractUser
from django.contrib.auth import get_user_model
from django.utils import timezone
import random
from datetime import timedelta

# Custom user model
class User(AbstractUser):
    email = models.EmailField(unique=True)
    otp = models.CharField(max_length=4, blank=True, null=True)  # temporary OTP

    is_verified = models.BooleanField(default=False)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def generate_otp(self):
        self.otp = f"{random.randint(1000, 9999)}"
        self.save()
        return self.otp

    def __str__(self):
        return self.email

User = get_user_model()

# OTP model
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
            # ✅ Use timezone-aware datetime
            self.expires_at = timezone.now() + timedelta(minutes=5)
        super().save(*args, **kwargs)

    def is_expired(self):
        # ✅ Use timezone-aware datetime for comparison
        return timezone.now() > self.expires_at