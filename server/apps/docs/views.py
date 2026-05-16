from django.http import Http404
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.throttling import UserRateThrottle
from django.db import transaction

# NECESSARY FOR REAL-TIME SYNC
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

from apps.workspaces.models import WorkspaceMember
from .models import Document
from .serializers import DocumentSerializer
from .tasks import generate_document_pdf, sync_document_to_qdrant

class AIActionRateThrottle(UserRateThrottle):
    scope = 'ai_action'

class DocumentListCreateView(APIView):
    permission_classes = [IsAuthenticated]
    serializer_class = DocumentSerializer

    def get_throttles(self):
        if self.request.method == 'POST':
            return [AIActionRateThrottle()]
        return super().get_throttles()

    def get(self, request, workspace_id):
        if not WorkspaceMember.objects.filter(
            workspace__id=workspace_id, user=request.user
        ).exists():
            return Response(
                {"error": "You are not a member of this workspace."},
                status=status.HTTP_403_FORBIDDEN,
            )

        documents = Document.objects.filter(
            workspace__id=workspace_id, is_deleted=False
        ).order_by('-updated_at')
        
        serializer = self.serializer_class(documents, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, workspace_id):
        try:
            member = WorkspaceMember.objects.get(
                workspace__id=workspace_id, user=request.user
            )
            if member.role not in ["OWNER", "EDITOR"]:
                return Response(
                    {"detail": "Permission denied. Viewers cannot create documents."},
                    status=status.HTTP_403_FORBIDDEN,
                )

            serializer = self.serializer_class(data=request.data)
            if serializer.is_valid():
                document = serializer.save(workspace_id=workspace_id, creator=request.user)
                sync_document_to_qdrant.delay(document.id)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        except WorkspaceMember.DoesNotExist:
            return Response(
                {"error": "Not a workspace member."}, status=status.HTTP_403_FORBIDDEN
            )

class DocumentDetailView(APIView):
    permission_classes = [IsAuthenticated]
    serializer_class = DocumentSerializer

    def get_throttles(self):
        if self.request.method == 'PUT':
            return [AIActionRateThrottle()]
        return super().get_throttles()

    def get_valid_document(self, pk, user):
        try:
            document = Document.objects.get(pk=pk, is_deleted=False)
            member = WorkspaceMember.objects.get(
                workspace=document.workspace, user=user
            )
            return document, member, None
        except Document.DoesNotExist:
            return None, None, ({"error": "Document not found."}, status.HTTP_404_NOT_FOUND)
        except WorkspaceMember.DoesNotExist:
            return None, None, ({"error": "Access denied."}, status.HTTP_403_FORBIDDEN)

    def get(self, request, pk):
        doc, _, error = self.get_valid_document(pk, request.user)
        if error:
            return Response(error[0], status=error[1])
            
        serializer = self.serializer_class(doc)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, pk):
        doc, member, error = self.get_valid_document(pk, request.user)
        if error:
            return Response(error[0], status=error[1])

        if member.role == "VIEWER":
            return Response({"error": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)

        old_content = doc.content
        serializer = self.serializer_class(doc, data=request.data, partial=True)
        
        if serializer.is_valid():
            updated_doc = serializer.save()
            
            # BROADCAST TO OTHERS
            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                f'doc_{pk}',
                {
                    'type': 'doc_update',
                    'title': updated_doc.title,
                    'content': updated_doc.content,
                    'sender_id': request.user.id 
                }
            )
            
            if old_content != updated_doc.content:
                sync_document_to_qdrant.delay(updated_doc.id)
                
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        doc, member, error = self.get_valid_document(pk, request.user)
        if error:
            return Response(error[0], status=error[1])
            
        if member.role not in ["OWNER", "EDITOR"]:
            return Response({"error": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)
            
        doc.soft_delete()
        return Response({"message": "Document moved to trash."}, status=status.HTTP_204_NO_CONTENT)

class DocumentTrashView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, workspace_id):
        if not WorkspaceMember.objects.filter(workspace_id=workspace_id, user=request.user).exists():
            return Response({"error": "Access denied."}, status=status.HTTP_403_FORBIDDEN)

        trash_docs = Document.objects.filter(workspace_id=workspace_id, is_deleted=True).order_by('-updated_at')
        serializer = DocumentSerializer(trash_docs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, pk):
        document = get_object_or_404(Document, pk=pk, is_deleted=True)
        if not WorkspaceMember.objects.filter(workspace=document.workspace, user=request.user).exists():
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)

        document.is_deleted = False
        document.save()
        sync_document_to_qdrant.delay(document.id)
        return Response({"message": "Document restored successfully."}, status=status.HTTP_200_OK)

    def delete(self, request, pk):
        document = get_object_or_404(Document, pk=pk, is_deleted=True)
        member = get_object_or_404(WorkspaceMember, workspace=document.workspace, user=request.user)
        
        if member.role != "OWNER":
            return Response({"error": "Only workspace owners can permanently delete files."}, status=status.HTTP_403_FORBIDDEN)
            
        document.delete()
        return Response({"message": "Permanently deleted."}, status=status.HTTP_204_NO_CONTENT)

class DocumentPDFExportView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_classes = [AIActionRateThrottle]

    def post(self, request, pk):
        document = get_object_or_404(Document, pk=pk)
        
        if not WorkspaceMember.objects.filter(workspace=document.workspace, user=request.user).exists():
            return Response({"error": "Access denied."}, status=status.HTTP_403_FORBIDDEN)

        if document.is_exporting:
            return Response({"detail": "Export already in progress."}, status=status.HTTP_409_CONFLICT)

        with transaction.atomic():

            Document.objects.filter(pk=pk).update(is_exporting=True)
            
            transaction.on_commit(lambda: generate_document_pdf.delay(document.id))

        return Response({"detail": "PDF generation started."}, status=status.HTTP_202_ACCEPTED)