import logging
import re
import json
import boto3
from django.conf import settings
from asgiref.sync import async_to_sync
from celery import shared_task
from channels.layers import get_channel_layer
from django.contrib.auth import get_user_model
from django.utils import timezone

from apps.notifications.models import Notification
from apps.workspaces.models import WorkSpace

User = get_user_model()
logger = logging.getLogger(__name__)

sqs_client = boto3.client(
    'sqs',
    region_name=settings.AWS_REGION,
    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY
)
@shared_task
def process_chat_mention_task(message_content, sender_id, workspace_id):
    print("starting")

    usernames = list(set(re.findall(r"@(\w+)", message_content)))
    if not usernames:
        return "No mentions found."

    try:
        sender = User.objects.get(id=sender_id)
        workspace = WorkSpace.objects.get(id=workspace_id)

        valid_users = User.objects.filter(
            username__in=usernames
        ).exclude(id=sender.id).distinct()

        if not valid_users.exists():
            return "No valid users to notify."

        notifications_to_create = [
            Notification(
                recipient=user,
                sender=sender,
                message=f"{sender.username} mentioned you in {workspace.name}",
                notification_type="mention",
            )
            for user in valid_users
        ]

        created_notifications = Notification.objects.bulk_create(notifications_to_create)

        channel_layer = get_channel_layer()
        sqs_entries = []

        for note in created_notifications:

            timestamp = note.created_at.isoformat() if note.created_at else timezone.now().isoformat()

            # WEBSOCKET
         
            group_name = f"user_notifications_{note.recipient.id}"
            async_to_sync(channel_layer.group_send)(
                group_name,
                {
                    "type": "send_notification",
                    "content": {
                        "id": note.id,
                        "message": note.message,
                        "sender": sender.username,
                        "created_at": timestamp,
                    },
                },
            )

            # FCM TOKEN FROM USER MODEL
            token = note.recipient.fcm_token

            if token:
                print("givecode")

                payload = {
                    "token": token,
                    "title": f"New Mention in {workspace.name}",
                    "body": note.message,
                    "data": {
                        "workspace_id": str(workspace_id),
                        "notification_id": str(note.id)
                    }
                }

                sqs_entries.append({
                    "Id": str(note.id),
                    "MessageBody": json.dumps(payload)
                })
                
        # SEND TO SQS
        if sqs_entries:
            for i in range(0, len(sqs_entries), 10):
                batch = sqs_entries[i:i + 10]

                try:
                    sqs_client.send_message_batch(
                        QueueUrl=settings.AWS_SQS_QUEUE_URL,
                        Entries=batch
                    )
                except Exception as sqs_err:
                    logger.error(f"SQS Error: {sqs_err}")

        return f"Processed {len(created_notifications)} mentions"

    except Exception as e:
        logger.error(str(e))
        return str(e)
    
@shared_task        
def process_workspace_invitation_task(inviter_id, recipient_id, workspace_id):
    try:
        sender = User.objects.get(id=inviter_id)
        recipient = User.objects.get(id=recipient_id)
        workspace = WorkSpace.objects.get(id=workspace_id)

        # 1. SAVE TO DATABASE
        note = Notification.objects.create(
            recipient=recipient,
            sender=sender,
            message=f"{sender.username} invited you to join {workspace.name}",
            notification_type="invitation",
        )

        # 2. SEND VIA WEBSOCKET (Critical: include notification_type)
        channel_layer = get_channel_layer()
        group_name = f"user_notifications_{recipient.id}"
        timestamp = note.created_at.isoformat() if note.created_at else timezone.now().isoformat()
        
        async_to_sync(channel_layer.group_send)(
            group_name,
            {
                "type": "send_notification",
                "content": {
                    "id": note.id,
                    "message": note.message,
                    "sender_username": sender.username, # Matches Serializer field
                    "notification_type": "invitation", # Required for Frontend UI
                    "is_read": note.is_read,
                    "created_at": timestamp,
                },
            },
        )

        # 3. SEND PUSH NOTIFICATION (FCM)
        token = recipient.fcm_token
        if token:
            payload = {
                "token": token,
                "title": "Workspace Invitation",
                "body": note.message,
                "data": {
                    "type": "invitation",
                    "workspace_id": str(workspace_id),
                    "notification_id": str(note.id)
                }
            }
            sqs_client.send_message(
                QueueUrl=settings.AWS_SQS_QUEUE_URL,
                MessageBody=json.dumps(payload)
            )
        return f"Invitation processed for {recipient.username}"
    except Exception as e:
        logger.error(f"Error in invitation task: {str(e)}")
        return str(e)