import time
from agora_token_builder import RtcTokenBuilder
from django.conf import settings

def generate_agora_token(channel_name, user_id):
    """
    Generates a secure RTC token for a specific user and channel.
    """
    # Role 1 is for "Publisher" (can speak and share video)
    role = 1 
    
    expiration_time_in_seconds = 3600 * 24
    current_timestamp = int(time.time())
    privilege_expired_ts = current_timestamp + expiration_time_in_seconds

    token = RtcTokenBuilder.buildTokenWithUid(
        settings.AGORA_APP_ID,
        settings.AGORA_APP_CERTIFICATE,
        channel_name,
        user_id,
        role,
        privilege_expired_ts
    )
    return token