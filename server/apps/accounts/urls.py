from django.urls import path


from .views import (
    EnableMfaView,
    ForgotPassView,
    GoogleAuthView,
    LoginView,
    RegisterView,
    ResendOtpView,
    ResetPassView,
    UserProfileView,
    VerifyMFAView,
    VerifyOTPView,
    SaveFCMTokenView,
    CookieTokenRefreshView,
    LogoutView
)

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", LoginView.as_view(), name="login"),
    
    # --- Token Management ---
    path("token/refresh/", CookieTokenRefreshView.as_view(), name="token_refresh"),
    path("logout/", LogoutView.as_view(), name="token_blacklist"),
    # ------------------------

    path("verify_otp/", VerifyOTPView.as_view(), name="verify_otp"),
    path("resend_otp/", ResendOtpView.as_view(), name="resent_otp"),
    path("google_login/", GoogleAuthView.as_view(), name="google-login"),
    path("enable_mfa/", EnableMfaView.as_view(), name="enable_mfa"),
    path("verify_mfa/", VerifyMFAView.as_view(), name="verify_mfa"),
    path("forgot_pass/", ForgotPassView.as_view(), name="forgot_pass"),
    path("reset_pass/<uidb64>/<token>/", ResetPassView.as_view(), name="Reset_pass"),
    path("user/profile/", UserProfileView.as_view(), name="user-profile"),
    path('update-fcm-token/', SaveFCMTokenView.as_view(), name='update-fcm-token'),
]