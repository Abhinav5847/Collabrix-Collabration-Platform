from rest_framework import serializers
from rest_framework.validators import UniqueValidator
from django.utils.text import slugify
from .models import WorkSpace

class WorkspaceSerializer(serializers.ModelSerializer):
    name = serializers.CharField(
        required=True,
        validators=[UniqueValidator(queryset=WorkSpace.objects.all(), message="A workspace with this name already exists.")]
    )
    owner_email = serializers.ReadOnlyField(source='owner.email')
    owner_name = serializers.ReadOnlyField(source='owner.username') 

    class Meta:
        model = WorkSpace
        fields = ['id', 'name', 'slug', 'description', 'owner_email', 'owner_name', 'created_at']
        read_only_fields = ['id', 'slug', 'created_at', 'owner_email', 'owner_name']

    def validate_name(self, value):
        if len(value) < 3:
            raise serializers.ValidationError("Workspace name must be at least 3 characters long.")
        return value

    def validate(self, data):
        name = data.get('name')
        if name:
            generated_slug = slugify(name)
            workspace_id = self.instance.id if self.instance else None
            
            if WorkSpace.objects.filter(slug=generated_slug).exclude(id=workspace_id).exists():
                raise serializers.ValidationError(
                    {"name": "This name results in a duplicate URL slug. Please choose a slightly different name."}
                )
        return data