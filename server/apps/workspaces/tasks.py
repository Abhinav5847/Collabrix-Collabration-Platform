from celery import shared_task
from datetime import timedelta


@shared_task
def permanent_delete_old_trash():
    from apps.docs.models import Document
    from django.utils import timezone

    cutoff = timezone.now() - timedelta(days=30) 
    old_docs = Document.objects.filter(
        is_deleted=True, 
        deleted_at__lte=cutoff
    )
    
    count = old_docs.count()
    old_docs.delete() 
    
    return f"Janitor: Permanently removed {count} old documents from trash."