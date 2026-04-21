from celery import shared_task
from django.core.files.base import ContentFile
from django.template.loader import render_to_string
from django.utils import timezone
from weasyprint import HTML
import requests
from django.conf import settings

from .models import Document


@shared_task
def generate_document_pdf(document_id):
    try:
        doc = Document.objects.get(id=document_id)

        context = {"document": doc, "generated_at": timezone.now()}
        html_string = render_to_string("documents/pdf_template.html", context)

        pdf_bytes = HTML(string=html_string).write_pdf()

        filename = f"PDF_{doc.id}_{timezone.now().strftime('%Y%m%d_%H%M')}.pdf"
        doc.pdf_file.save(filename, ContentFile(pdf_bytes), save=False)

        doc.is_exporting = False
        doc.save()

        return f"Successfully created PDF for {doc.title}"
    except Exception as e:
        Document.objects.filter(id=document_id).update(is_exporting=False)
        return str(e)


@shared_task
def sync_document_to_qdrant(document_id):
    """
    Sends document content to the AI service for vectorization.
    """
    try:
        doc = Document.objects.get(id=document_id)
        
        # Skip if there's no content to vectorize
        if not doc.content or doc.is_deleted:
            return "Skipping: Document empty or in trash."

        # The internal Docker URL for your AI service
        ai_service_url = "http://ai_service:8001/ai/ingest"

        payload = {
            "text": doc.content,
            "workspace_id": str(doc.workspace.id),
            "doc_id": str(doc.id)
        }

        response = requests.post(ai_service_url, json=payload, timeout=10)
        response.raise_for_status()

        return f"Successfully synced '{doc.title}' to AI Service."
    
    except Exception as e:
        return f"RAG Sync Error: {str(e)}"