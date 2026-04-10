from rest_framework import serializers

from .models import Document


class DocumentSerializer(serializers.ModelSerializer):
    creator_email = serializers.ReadOnlyField(source="creater.mail")

    class Meta:
        model = Document
        fields = [
            "id",
            "title",
            "content",
            "workspace",
            "creator",
            "creator_email",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "workspace", "creator", "created_at", "updated_at"]
