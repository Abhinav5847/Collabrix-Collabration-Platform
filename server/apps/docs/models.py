from django.conf import settings
from django.db import models
from django.utils import timezone


class Document(models.Model):
    title = models.CharField(max_length=255)
    content = models.TextField(blank=True)
    workspace = models.ForeignKey(
        "apps_workspaces.WorkSpace", on_delete=models.CASCADE, related_name="documents"
    )
    creator = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateField(auto_now=True)
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)

    def soft_delete(self):
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.save()

    def restore(self):
        self.is_deleted = False
        self.deleted_at = None
        self.save()

    def __str__(self):
        return self.title
