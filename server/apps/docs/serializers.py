from rest_framework import serializers
from .models import Document


class DocumentSerializer(serializers.ModelSerializer):
    # Fixed typos: 'creater' -> 'creator' and 'mail' -> 'email'
    creator_email = serializers.ReadOnlyField(source="creator.email")

    class Meta:
        model = Document
        fields = [
            "id",
            "title",
            "content",
            "workspace",
            "creator",
            "creator_email",
            "is_exporting",  # Added so React can read polling updates
            "pdf_file",      # Added so React can read the download URL
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id", 
            "workspace", 
            "creator", 
            "is_exporting", 
            "pdf_file", 
            "created_at", 
            "updated_at"
        ]