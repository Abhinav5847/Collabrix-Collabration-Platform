from celery import shared_task
from django.core.files.base import ContentFile
from django.template.loader import render_to_string
from django.utils import timezone
from weasyprint import HTML
import requests
import logging
from django.conf import settings

from .models import Document

logger = logging.getLogger(__name__)


@shared_task(name="apps.docs.tasks.generate_document_pdf")
def generate_document_pdf(document_id):
    try:
        # 1. Fetch document inside the isolated worker thread
        doc = Document.objects.get(id=document_id)

        # 2. Render layout templates to a string
        context = {"document": doc, "generated_at": timezone.now()}
        html_string = render_to_string("documents/pdf_template.html", context)

        # 3. Generate binary pdf data
        pdf_bytes = HTML(string=html_string).write_pdf()

        # 4. Save file to storage
        filename = f"PDF_{doc.id}_{timezone.now().strftime('%Y%m%d_%H%M')}.pdf"
        
        # FIX: Pass save=False to avoid executing a full instance save() rewrite.
        # This prevents the instance from overwriting concurrent database changes.
        doc.pdf_file.save(filename, ContentFile(pdf_bytes), save=False)

        # 5. Atomically commit both fields using .update() to ensure clean concurrency
        Document.objects.filter(id=document_id).update(
            pdf_file=doc.pdf_file,
            is_exporting=False
        )

        logger.info(f"Successfully created PDF for Document ID: {document_id}")
        return f"Successfully created PDF for {doc.title}"

    except Exception as e:
        logger.error(f"Error compiling PDF inside task runner: {str(e)}")
        # Safeguard fallback to release frontend loading state
        Document.objects.filter(id=document_id).update(is_exporting=False)
        return str(e)


@shared_task
def sync_document_to_qdrant(document_id):
    try:
        doc = Document.objects.get(id=document_id)
        
        if not doc.content or doc.is_deleted:
            return "Skipping: Document empty or in trash."

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