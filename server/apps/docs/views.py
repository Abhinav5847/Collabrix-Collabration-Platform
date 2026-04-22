from django.http import Http404
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.throttling import UserRateThrottle

from apps.workspaces.models import WorkspaceMember
from .models import Document
from .serializers import DocumentSerializer
from .tasks import generate_document_pdf, sync_document_to_qdrant

# --- 1. Custom Throttle Class ---
class AIActionRateThrottle(UserRateThrottle):
    scope = 'ai_action'

# --- 2. Views ---

class DocumentListCreateView(APIView):
    permission_classes = [IsAuthenticated]
    serializer_class = DocumentSerializer

    # We only want to limit POST (creating) because it triggers Qdrant Sync.
    # GET (listing) should be allowed more frequently.
    def get_throttles(self):
        if self.request.method == 'POST':
            return [AIActionRateThrottle()]
        return super().get_throttles()

    def get(self, request, workspace_id):
        try:
            if not WorkspaceMember.objects.filter(
                workspace__id=workspace_id, user=request.user
            ).exists():
                return Response(
                    {"error": "You are not a member of this workspace."},
                    status=status.HTTP_403_FORBIDDEN,
                )

            documents = Document.objects.filter(
                workspace__id=workspace_id, is_deleted=False
            )
            serializer = self.serializer_class(documents, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

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

    # We only limit PUT (editing) because it triggers Qdrant Sync.
    def get_throttles(self):
        if self.request.method == 'PUT':
            return [AIActionRateThrottle()]
        return super().get_throttles()

    def get_object(self, pk, user):
        try:
            document = Document.objects.get(pk=pk)
            member = WorkspaceMember.objects.get(
                workspace=document.workspace, user=user
            )
            return document, member
        except Document.DoesNotExist:
            return None, "Document not found."
        except WorkspaceMember.DoesNotExist:
            return None, "You are not a member of the workspace owning this document."

    def get(self, request, pk):
        document, error = self.get_object(pk, request.user)
        if not document:
            return Response({"error": error}, status=status.HTTP_404_NOT_FOUND if "found" in error else status.HTTP_403_FORBIDDEN)
        serializer = self.serializer_class(document)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, pk):
        document, error = self.get_object(pk, request.user)
        if not document:
            return Response({"error": error}, status=status.HTTP_404_NOT_FOUND)

        member = WorkspaceMember.objects.get(workspace=document.workspace, user=request.user)
        if member.role == "VIEWER":
            return Response({"error": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)

        serializer = self.serializer_class(document, data=request.data, partial=True)
        if serializer.is_valid():
            updated_doc = serializer.save()
            sync_document_to_qdrant.delay(updated_doc.id)
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        document, error = self.get_object(pk, request.user)
        if not document:
            return Response({"error": error}, status=status.HTTP_404_NOT_FOUND)
        document.soft_delete()
        return Response({"message": "Document moved to trash."}, status=status.HTTP_204_NO_CONTENT)


class DocumentTrashView(APIView):
    permission_classes = [IsAuthenticated]
    # Restoring from trash triggers a re-index, so we throttle the whole class
    throttle_classes = [AIActionRateThrottle]

    def get(self, request, workspace_id):
        if not WorkspaceMember.objects.filter(workspace_id=workspace_id, user=request.user).exists():
            return Response({"error": "Access denied."}, status=status.HTTP_403_FORBIDDEN)

        trash_docs = Document.objects.filter(workspace_id=workspace_id, is_deleted=True)
        serializer = DocumentSerializer(trash_docs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, pk):
        try:
            document = Document.objects.get(pk=pk, is_deleted=True)
            document.is_deleted = False
            document.save()
            sync_document_to_qdrant.delay(document.id)
            return Response({"message": "Document restored successfully."}, status=status.HTTP_200_OK)
        except Document.DoesNotExist:
            return Response({"error": "Not found in trash."}, status=status.HTTP_404_NOT_FOUND)

    def delete(self, request, pk):
        document = get_object_or_404(Document, pk=pk, is_deleted=True)
        document.delete()
        return Response({"message": "Permanently deleted."}, status=status.HTTP_204_NO_CONTENT)


class DocumentPDFExportView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_classes = [AIActionRateThrottle]

    def post(self, request, pk):
        document = get_object_or_404(Document, pk=pk)
        if document.is_exporting:
            return Response({"detail": "Export in progress."}, status=status.HTTP_409_CONFLICT)

        document.is_exporting = True
        document.save()
        generate_document_pdf.delay(document.id)
        return Response({"detail": "Started."}, status=status.HTTP_202_ACCEPTED)