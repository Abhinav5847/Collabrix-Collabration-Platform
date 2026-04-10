import logging
import re

from asgiref.sync import async_to_sync
from celery import shared_task
from channels.layers import get_channel_layer
from django.contrib.auth import get_user_model

from apps.notifications.models import Notification
from apps.workspaces.models import WorkSpace

User = get_user_model()
logger = logging.getLogger(__name__)


@shared_task
def process_chat_mention_task(message_content, sender_id, workspace_id):
    usernames = re.findall(r"@(\w+)", message_content)

    if not usernames:
        return "No mentions found in message."

    try:
        sender = User.objects.get(id=sender_id)
        workspace = WorkSpace.objects.get(id=workspace_id)

        valid_users = []
        for name in usernames:
            matched_user = User.objects.filter(username__iexact=name).first()

            if matched_user:
                if matched_user.id != sender.id:
                    valid_users.append(matched_user)
                else:
                    logger.info(f"Skipping self-mention for {sender.username}")
            else:
                logger.warning(f"User @{name} not found in database.")

        if not valid_users:
            return f"Mentions found ({usernames}), but no matching users exist in DB."

        notifications_to_create = [
            Notification(
                recipient=user,
                sender=sender,
                message=f"{sender.username} mentioned you in {workspace.name}",
                notification_type="mention",
            )
            for user in valid_users
        ]
        created_notifications = Notification.objects.bulk_create(
            notifications_to_create
        )

        channel_layer = get_channel_layer()

        for note in created_notifications:
            group_name = f"user_notifications_{note.recipient.id}"

            async_to_sync(channel_layer.group_send)(
                group_name,
                {
                    "type": "send_notification",
                    "content": {
                        "id": note.id,
                        "message": note.message,
                        "sender": sender.username,
                        "created_at": (
                            note.created_at.isoformat() if note.created_at else None
                        ),
                    },
                },
            )

        return f"Successfully processed {len(created_notifications)} mentions."

    except (User.DoesNotExist, WorkSpace.DoesNotExist) as e:
        return f"Database error: {str(e)}"
    except Exception as e:
        logger.error(f"Unexpected error in mention task: {str(e)}")
        return f"Unexpected error: {str(e)}"
