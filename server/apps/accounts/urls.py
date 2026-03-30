from django.urls import path
from .views import RegisterView,LoginView,VerifyOTPView,ResendOtpView


urlpatterns = [
    path('register/',RegisterView.as_view(),name='register'),
    path('login/',LoginView.as_view(),name='login'),
    path('verify_otp/',VerifyOTPView.as_view(),name='verify_otp'),
    path('resend_otp/',ResendOtpView.as_view(),name='verify_otp'),
]