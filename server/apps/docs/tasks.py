from celery import shared_task
from django.template.loader import render_to_string
from django.core.files.base import ContentFile
from django.utils import timezone
from weasyprint import HTML
from .models import Document

@shared_task
def generate_document_pdf(document_id):
    try:
        doc = Document.objects.get(id=document_id)
        
        context = {'document': doc, 'generated_at': timezone.now()}
        html_string = render_to_string('documents/pdf_template.html', context)
        
        pdf_bytes = HTML(string=html_string).write_pdf()
        
        filename = f"PDF_{doc.id}_{timezone.now().strftime('%Y%m%d_%H%M')}.pdf"
        doc.pdf_file.save(filename, ContentFile(pdf_bytes), save=False)
        
        doc.is_exporting = False
        doc.save()
        
        return f"Successfully created PDF for {doc.title}"
    except Exception as e:
        Document.objects.filter(id=document_id).update(is_exporting=False)
        return str(e)