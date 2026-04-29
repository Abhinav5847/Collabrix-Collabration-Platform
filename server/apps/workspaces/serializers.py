from django.contrib.auth import get_user_model
from rest_framework import serializers
from rest_framework.validators import UniqueValidator
from .models import WorkSpace, WorkspaceMember, WorkspaceMessage

User = get_user_model()

class WorkspaceSerializer(serializers.ModelSerializer):
    owner_email = serializers.ReadOnlyField(source="owner.email")
    owner_name = serializers.ReadOnlyField(source="owner.username")

    class Meta:
        model = WorkSpace
        fields = ["id", "name", "description", "owner_email", "owner_name", "created_at"]
        read_only_fields = ["id", "created_at", "owner_email", "owner_name"]

class UserSelectSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email']

class WorkspaceMemberSerializer(serializers.ModelSerializer):
    # Field names for display
    user_name = serializers.ReadOnlyField(source="user.username")
    email = serializers.ReadOnlyField(source="user.email")
    
    # Logic Fix: Change 'user_id' to 'user' to match the React payload
    user = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), 
        write_only=True
    )

    class Meta:
        model = WorkspaceMember
        # 'workspace' is required by the model, so we include it as read_only
        fields = ["id", "user", "user_name", "email", "role", "workspace"]
        read_only_fields = ["workspace"]

    def validate_role(self, value):
        if value == "OWNER":
            raise serializers.ValidationError("Cannot manually assign OWNER role.")
        return value
    
class WorkspaceMessageSerializer(serializers.ModelSerializer):
    # Mapping 'user.email' to 'sender' for the frontend
    sender = serializers.CharField(source="user.email", read_only=True)
    
    # We keep 'content' as the primary field to match your React fetchHistory logic,
    # but we can also provide 'message' as an alias if needed.
    # To keep it simple, let's just use the real model field name: 'content'
    
    class Meta:
        model = WorkspaceMessage
        fields = ["id", "sender", "content", "timestamp"]