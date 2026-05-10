from django.conf import settings
from django.db import models
import uuid
from django.utils import timezone
from datetime import timedelta     


class WorkSpace(models.Model):
    name = models.CharField(max_length=55)
    description = models.TextField(blank=True, null=True)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="owned_workspaces",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class WorkspaceMember(models.Model):
    ROLE_CHOICES = [("OWNER", "Owner"), ("EDITOR", "Editor"), ("VIEWER", "Viewer")]
    workspace = models.ForeignKey(
        WorkSpace, on_delete=models.CASCADE, related_name="members"
    )
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="VIEWER")

    class Meta:
        unique_together = ("workspace", "user")

    def __str__(self):
        return f"{self.user} - {self.role} in {self.workspace.name}"


class WorkspaceMessage(models.Model):
    workspace = models.ForeignKey(
        WorkSpace, on_delete=models.CASCADE, related_name="chat_messages"
    )
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["timestamp"]

    def __str__(self):
        return f"{self.user.email}: {self.content[:20]}"

class WorkspaceInvitation(models.Model):

    workspace = models.ForeignKey(
        WorkSpace, on_delete=models.CASCADE, related_name="invitations"
    )
    email = models.EmailField()
    role = models.CharField(
        max_length=20, 
        choices=WorkspaceMember.ROLE_CHOICES, 
        default="VIEWER"
    )
    token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    is_used = models.BooleanField(default=False)

    def is_expired(self):
       
        return timezone.now() > self.created_at + timedelta(hours=48)

    def __str__(self):
        return f"Invite for {self.email} to {self.workspace.name}"        

class Meeting(models.Model):
    STATUS_CHOICES = [
        ("recording", "Recording"),
        ("processing", "Processing AI Summary"),
        ("completed", "Completed"),
        ("failed", "Failed"),
    ]

    workspace = models.ForeignKey(
        WorkSpace, 
        on_delete=models.CASCADE, 
        related_name="meetings"
    )
    # The member who initiated the meeting/recording
    host = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE,
        related_name="hosted_meetings"
    )
    
    # S3 integration: audio_file will automatically upload to S3 if 
    # django-storages is configured in your settings.py
    audio_file = models.FileField(
        upload_to='meetings/recordings/%Y/%m/%d/', 
        null=True, 
        blank=True
    )
    
    # AI Summary Data
    transcript = models.TextField(blank=True, null=True)
    summary = models.TextField(blank=True, null=True)
    
    status = models.CharField(
        max_length=20, 
        choices=STATUS_CHOICES, 
        default="recording"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Meeting in {self.workspace.name} on {self.created_at.strftime('%Y-%m-%d')}"    
    
