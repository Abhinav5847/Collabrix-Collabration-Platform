from rest_framework import serializers

from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    sender_username = serializers.ReadOnlyField(source="sender.username")

    class Meta:
        model = Notification
        fields = [
            "id",
            "sender_username",
            "message",
            "notification_type",
            "is_read",
            "created_at",
        ]
