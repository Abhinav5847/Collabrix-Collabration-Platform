import sib_api_v3_sdk
from django.conf import settings
from sib_api_v3_sdk.rest import ApiException


def send_otp_email(to_email, otp):
    configuration = sib_api_v3_sdk.Configuration()
    configuration.api_key["api-key"] = settings.BREVO_API_KEY

    api_instance = sib_api_v3_sdk.TransactionalEmailsApi(
        sib_api_v3_sdk.ApiClient(configuration)
    )

    send_smtp_email = sib_api_v3_sdk.SendSmtpEmail(
        to=[{"email": to_email}],
        sender={"email": settings.BREVO_SENDER_EMAIL, "name": "Collabrix"},
        subject="Your OTP Verification Code",
        html_content=f"<h3>Your OTP is: {otp}</h3><p>It will expire in 5minutes.</p>",
    )

    try:
        api_instance.send_transac_email(send_smtp_email)
        return True
    except ApiException as e:
        print(f"Error sending email: {e}")
        return False
