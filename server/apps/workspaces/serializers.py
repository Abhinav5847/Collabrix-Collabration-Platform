from django.contrib.auth import get_user_model
from django.utils.text import slugify
from rest_framework import serializers
from rest_framework.validators import UniqueValidator

from .models import WorkSpace, WorkspaceMember


class WorkspaceSerializer(serializers.ModelSerializer):
    name = serializers.CharField(
        required=True,
        validators=[
            UniqueValidator(
                queryset=WorkSpace.objects.all(),
                message="A workspace with this name already exists.",
            )
        ],
    )
    owner_email = serializers.ReadOnlyField(source="owner.email")
    owner_name = serializers.ReadOnlyField(source="owner.username")

    class Meta:
        model = WorkSpace
        fields = [
            "id",
            "name",
            "description",
            "owner_email",
            "owner_name",
            "created_at",
        ]
        read_only_fields = ["id", "created_at", "owner_email", "owner_name"]

    def validate_name(self, value):
        if len(value) < 3:
            raise serializers.ValidationError(
                "Workspace name must be at least 3 characters long."
            )
        return value


User = get_user_model()


class WorkspaceMemberSerializer(serializers.ModelSerializer):
    username = serializers.ReadOnlyField(source="user.username")
    email = serializers.ReadOnlyField(source="user.email")
    user_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), source="user", write_only=True
    )

    class Meta:
        model = WorkspaceMember
        fields = ["id", "user_id", "username", "email", "role"]

    def validate_role(self, value):
        if value == "OWNER":
            raise serializers.ValidationError(
                "Cannot manually assign OWNER role. Only the creator is the owner."
            )
        return value
