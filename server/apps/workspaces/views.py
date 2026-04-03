from django.shortcuts import render
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from rest_framework.permissions import AllowAny,IsAuthenticated
from django.shortcuts import get_object_or_404
from rest_framework.exceptions import ValidationError as DRFValidationError
from .serializers import WorkspaceSerializer
from .models import WorkSpace,WorkspaceMember

class WorkspaceListCreateView(APIView):
    permission_classes = [IsAuthenticated]
    serializer_class = WorkspaceSerializer

    def get(self,request):
        try:
            workspaces = WorkSpace.objects.filter(members__user=request.user) 
            serializer = self.serializer_class(workspaces,many=True)
            return Response(serializer.data,status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error":str(e)},status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
    def post(self,request):
        try:
            serializer = self.serializer_class(data=request.data)
            serializer.is_valid(raise_exception=True)

            serializer.save(owner=request.user)

            return Response(serializer.data,status=status.HTTP_201_CREATED)
        
        except DRFValidationError as e:
            return Response({"error": e.detail}, status=status.HTTP_400_BAD_REQUEST)

class WorkspaceDetailView(APIView):
    permission_classes = [IsAuthenticated]
    serializer_class = WorkspaceSerializer

    def get_object(self,pk,user):
        return get_object_or_404(WorkSpace,pk=pk,members__user=user)
    
    def get(self,request,pk):
        try:
            workspace = self.get_object(pk,request.user)
            serialzier = self.serializer_class(workspace)
            return  Response(serialzier.data,status=status.HTTP_200_OK)
        
        except Exception:
            return Response({"error": "Workspace not found or access denied"}, status=status.HTTP_404_NOT_FOUND)

    def put(self,request,pk):
        try:
            workspace = self.get_object(pk,request.user)

            membership = WorkspaceMember.objects.get(workspace=workspace, user=request.user)

            if membership.role not in ['OWNER', 'EDITOR']:
                return Response({"error": "You do not have permission to edit this workspace"}, status=status.HTTP_403_FORBIDDEN)
            
            serializer = self.serializer_class(workspace, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data,status=status.HTTP_200_OK)
        
        except DRFValidationError as e:
            return Response({"error": e.detail}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
    def delete(self,request,pk):
        try:
            workspace = self.get_object(pk,request.user)

            if workspace.owner != request.user:
                return Response({"error": "Only the workspace owner can delete it"}, status=status.HTTP_403_FORBIDDEN)

            workspace.delete()
            return Response({"message": "Workspace deleted successfully"}, status=status.HTTP_204_NO_CONTENT)

        except Exception:
            return Response({"error": "Delete operation failed"}, status=status.HTTP_400_BAD_REQUEST)    

