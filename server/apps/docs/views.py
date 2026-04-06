from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .serializers import DocumentSerializer
from .models import Document
from apps.workspaces.models import WorkspaceMember
from django.http import Http404

class DocumentListCreateView(APIView):
    permission_classes = [IsAuthenticated]
    serializer_class = DocumentSerializer

    def get(self,request,workspace_id):
        try:
            member = WorkspaceMember.objects.get(workspace__id=workspace_id,user=request.user)
            documents = Document.objects.filter(workspace__id=workspace_id,is_deleted=False)
            serializer = self.serializer_class(documents,many=True)
            return Response(serializer.data,status=status.HTTP_200_OK)
        
        except WorkspaceMember.DoesNotExist:
            return Response({"error": "You are not a member of this workspace."}, status=status.HTTP_403_FORBIDDEN)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
    def post(self,request,workspace_id):
        try:
            member = WorkspaceMember.objects.get(workspace__id=workspace_id,user=request.user)

            if member.role not in ['OWNER','EDITOR']:
                return Response(
                    {"detail": "Permission denied. Viewers cannot create documents."}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            serializer = self.serializer_class(data=request.data)
            if serializer.is_valid():
                serializer.save(workspace_id=workspace_id,creator=request.user)
                return Response(serializer.data, status=status.HTTP_201_CREATED)

            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except WorkspaceMember.DoesNotExist:
            return Response({"error": "Not a workspace member."}, status=status.HTTP_403_FORBIDDEN)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR) 

class DocumentDetailView(APIView):
    permission_classes = [IsAuthenticated]
    serializer_class = DocumentSerializer

    def get_object(self,pk,user):
        try:
            document = Document.objects.get(pk=pk)
            member = WorkspaceMember.objects.get(workspace=document.workspace, user=user)
            return document, member
        except Document.DoesNotExist:
            return None, "Document not found."
        except WorkspaceMember.DoesNotExist:
            return None, "You are not a member of the workspace owning this document."

    def get(self, request, pk):
        try:
            document, error = self.get_object(pk, request.user)
            if not document:
                return Response({"error": error}, status=status.HTTP_403_FORBIDDEN if "member" in error else status.HTTP_404_NOT_FOUND)
            
            serializer = self.serializer_class(document)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def put(self,request,pk):
        try:
            document, error = self.get_object(pk, request.user)
            if not document:
                return Response({"error": error}, status=status.HTTP_404_NOT_FOUND)

            if error is None: 
                member = WorkspaceMember.objects.get(workspace=document.workspace, user=request.user)
                if member.role not in ['OWNER', 'EDITOR']:
                    return Response({"error": "Permission denied. Viewers cannot edit documents."}, status=status.HTTP_403_FORBIDDEN)

            serializer = self.serializer_class(document, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def delete(self, request, pk):
        try:
            document, error = self.get_object(pk, request.user)
            if not document:
                return Response({"error": error}, status=status.HTTP_404_NOT_FOUND)

            member = WorkspaceMember.objects.get(workspace=document.workspace, user=request.user)
            if member.role not in ['OWNER', 'EDITOR']:
                return Response({"error": "Permission denied. Only Owners/Editors can delete."}, status=status.HTTP_403_FORBIDDEN)

            document.soft_delete()
            return Response({"message": "Document moved to trash."}, status=status.HTTP_204_NO_CONTENT)
            
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)   

class DocumentTrashView(APIView):
    permission_classes = [IsAuthenticated]
    serializer_class = DocumentSerializer

    def get(self,request,workspace_id):
          if not WorkspaceMember.objects.filter(workspace_id=workspace_id, user=request.user).exists():
            return Response({"error": "Access denied."}, status=status.HTTP_403_FORBIDDEN)

          trash_docs = Document.objects.filter(workspace_id=workspace_id,is_deleted=True)
          serializer = DocumentSerializer(trash_docs,many=True,context={'request':request})
          return Response(serializer.data,status=status.HTTP_200_OK)   

    def post(self,request,pk):
        try:
            document = Document.objects.get(pk=pk,is_deleted=True)
            member = WorkspaceMember.objects.get(workspace=document.workspace,user=request.user)

            if member.role not in ['OWNER','EDITOR']:
                return Response ({"error": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)
            
            document.is_deleted = False
            document.deleted_at = None
            document.save()
            return Response({"message": "Document restored successfully."}, status=status.HTTP_200_OK)
        except (Document.DoesNotExist, WorkspaceMember.DoesNotExist):
            return Response({"error": "Document not found in trash."}, status=status.HTTP_404_NOT_FOUND)

    def delete(self,request,pk):
        try:
            document = Document.objects.get(pk=pk,is_deleted=True)
            member = WorkspaceMember.objects.get(workspace=document.workspace,user=request.user)

            if member.role != 'OWNER':
                return Response({"error": "Only Workspace Owners can permanently delete."}, status=status.HTTP_403_FORBIDDEN)

            document.delete()
            return Response({"message": "Document permanently deleted."}, status=status.HTTP_204_NO_CONTENT)
        
        except (Document.DoesNotExist, WorkspaceMember.DoesNotExist):
            return Response({"error": "Document not found."}, status=status.HTTP_404_NOT_FOUND)   
