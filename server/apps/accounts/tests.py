from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import UserOTP

User = get_user_model()


class RegistrationTests(APITestCase):

    def setUp(self):
        self.url = reverse("register")
        self.valid_payload = {
            "email": "test@collabrix.com",
            "username": "testuser",
            "password": "SecurePassword123!",
            "confirm_password": "SecurePassword123!",
        }

    @patch("apps.accounts.utils.send_otp_email.send_otp_email")
    def test_register_user_success(self, mock_send_email):
        mock_send_email.return_value = True

        response = self.client.post(self.url, self.valid_payload)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(User.objects.count(), 1)

        user = User.objects.get(email=self.valid_payload["email"])
        self.assertTrue(UserOTP.objects.filter(user=user).exists())
        self.assertFalse(user.is_verified)

    def test_register_duplicate_email(self):
        user_data = self.valid_payload.copy()
        user_data.pop("confirm_password")

        User.objects.create_user(**user_data)

        response = self.client.post(self.url, self.valid_payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class LoginTests(APITestCase):

    def setUp(self):
        self.url = reverse("login")
        self.user_data = {
            "email": "login@collabrix.com",
            "username": "loginuser",
            "password": "Password123!",
        }
        self.user = User.objects.create_user(**self.user_data)
        self.user.is_verified = True
        self.user.save()

    def test_login_success(self):
        payload = {
            "email": self.user_data["email"],
            "password": self.user_data["password"],
        }
        response = self.client.post(self.url, payload)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)

    def test_login_fail_unverified(self):

        self.user.is_verified = False
        self.user.save()

        payload = {
            "email": self.user_data["email"],
            "password": self.user_data["password"],
        }
        response = self.client.post(self.url, payload)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
