import boto3
import json
import logging
from django.conf import settings

logger = logging.getLogger(__name__)

def send_push_notification(user, title, body):
    if not user.fcm_token:
        logger.warning(f"User {user.username} has no FCM token.")
        return

    try:
        # Boto3 uses the keys from your .env automatically if configured in settings
        client = boto3.client(
            'lambda',
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_REGION
        )
        
        payload = {
            "token": user.fcm_token,
            "title": title,
            "body": body
        }

        # This triggers your 'send_fcm_notification' Lambda function
        client.invoke(
            FunctionName='send_fcm_notification',
            InvocationType='Event',  # 'Event' = Async (don't wait for response)
            Payload=json.dumps(payload)
        )
    except Exception as e:
        logger.error(f"Error triggering AWS Lambda: {str(e)}")