from django.db import models
from django.conf import settings
from django.utils.text import slugify

class WorkSpace(models.Model):
    name = models.CharField(max_length=55)
    description = models.TextField(blank=True, null=True)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='owned_workspaces'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name    
    
class WorkspaceMember(models.Model):
    ROLE_CHOICES = [
        ('OWNER','Owner'),
        ('EDITOR','Editor'),
        ('VIEWER','Viewer')
    ]
    workspace = models.ForeignKey(WorkSpace,on_delete=models.CASCADE,related_name='members')
    user = models.ForeignKey(settings.AUTH_USER_MODEL,on_delete=models.CASCADE)
    role = models.CharField(max_length=20,choices=ROLE_CHOICES,default='VIEWER')
    
    class Meta:
        unique_together = ('workspace','user')   
    
    def __str__(self):
        return f"{self.user} - {self.role} in {self.workspace.name}"