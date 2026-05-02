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
    user_name = serializers.ReadOnlyField(source="user.username")
    email = serializers.ReadOnlyField(source="user.email")
    
    user = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), 
        write_only=True,
        required=False 
    )

    class Meta:
        model = WorkspaceMember
        fields = ["id", "user", "user_name", "email", "role", "workspace"]
        read_only_fields = ["workspace"]

    def validate_role(self, value):
        if value == "OWNER":
            raise serializers.ValidationError("Cannot manually assign OWNER role.")
        return value
    
class WorkspaceMessageSerializer(serializers.ModelSerializer):
   
    sender = serializers.CharField(source="user.email", read_only=True)

    class Meta:
        model = WorkspaceMessage
        fields = ["id", "sender", "content", "timestamp"]