from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import WorkSpace, WorkspaceMember

@receiver(post_save, sender=WorkSpace)
def create_Owner(sender, instance, created, **kwargs):
    if created:
        WorkspaceMember.objects.create(
            workspace=instance, user=instance.owner, role="OWNER"
        )
