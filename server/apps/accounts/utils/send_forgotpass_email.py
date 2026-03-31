import sib_api_v3_sdk
from sib_api_v3_sdk.rest import ApiException
from django.conf import settings

def send_forgotpass_email(to_email, reset_link):
    configuration = sib_api_v3_sdk.Configuration()
    configuration.api_key['api-key'] = settings.BREVO_API_KEY

    api_instance = sib_api_v3_sdk.TransactionalEmailsApi(
        sib_api_v3_sdk.ApiClient(configuration)
    )

    send_smtp_email = sib_api_v3_sdk.SendSmtpEmail(
        to=[{"email": to_email}],
        sender={
            "email": settings.BREVO_SENDER_EMAIL,
            "name": "Collabrix"
        },
        subject="Reset Your Password",
        html_content=f"""
        <h3>Password Reset Request</h3>
        <p>Click the button below to reset your password:</p>

        <a href="{reset_link}" 
           style="padding:10px 20px; background:#007bff; color:white; text-decoration:none; border-radius:5px;">
           Reset Password
        </a>

        <p>This link will expire soon.</p>
        <p>If you didn't request this, ignore this email.</p>
        """
    )

    try:
        api_instance.send_transac_email(send_smtp_email)
        return True
    except ApiException as e:
        print(f"Error sending reset email: {e}")
        return False