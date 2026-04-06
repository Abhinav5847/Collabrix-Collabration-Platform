from django.db import models
from django.conf import settings

class Document(models.Model):
    title = models.CharField(max_length=255)
    content = models.TextField(blank=True)
    workspace = models.ForeignKey('workspaces.Workspace',on_delete=models.CASCADE,related_name='documents')
    creator = models.ForeignKey(settings.AUTH_USER_MODEL,on_delete=models.SET_NULL,null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateField(auto_now_add=True)

    def __str__(self):
        return self.title