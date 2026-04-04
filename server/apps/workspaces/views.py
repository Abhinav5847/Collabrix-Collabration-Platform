from django.shortcuts import render
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from rest_framework.permissions import AllowAny,IsAuthenticated
from django.shortcuts import get_object_or_404
from rest_framework.exceptions import ValidationError as DRFValidationError
from .serializers import WorkspaceSerializer,WorkspaceMemberSerializer
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

class MembersListCreateview(APIView):
    permission_classes = [IsAuthenticated]
    serializer_class = WorkspaceMemberSerializer

    def get(self,request,pk):
        try:
            workspace = get_object_or_404(WorkSpace,pk=pk,members__user=request.user)
            members = workspace.members.all()
            serializer = self.serializer_class(members,many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": "Unable to fetch members", "details": str(e)}, 
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def post(self, request, pk):
        try:
            workspace = get_object_or_404(WorkSpace, pk=pk)

            if workspace.owner != request.user:
                return Response({"error": "Only the workspace owner can invite members"}, 
                                status=status.HTTP_403_FORBIDDEN)

            serializer = self.serializer_class(data=request.data)
            serializer.is_valid(raise_exception=True)

            user_to_add = serializer.validated_data['user']

            if WorkspaceMember.objects.filter(workspace=workspace, user=user_to_add).exists():
                return Response({"error": "This user is already a member of this workspace"}, 
                                status=status.HTTP_400_BAD_REQUEST)

            serializer.save(workspace=workspace)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        except DRFValidationError as e:
            return Response({"error": e.detail}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": "An unexpected error occurred", "details": str(e)}, 
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class MembersDetailView(APIView):
    permission_classes = [IsAuthenticated]
    serializer_class = WorkspaceMemberSerializer

    def patch(self, request, pk, member_id):
        try:
            workspace = get_object_or_404(WorkSpace, pk=pk)

            if workspace.owner != request.user:
                return Response({"error": "Only the owner can modify roles"}, 
                                status=status.HTTP_403_FORBIDDEN)

            member_record = get_object_or_404(WorkspaceMember, pk=member_id, workspace=workspace)

            if member_record.user == workspace.owner:
                return Response({"error": "The owner role cannot be modified"}, 
                                status=status.HTTP_400_BAD_REQUEST)

            serializer = self.serializer_class(member_record, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            
            return Response(serializer.data, status=status.HTTP_200_OK)

        except DRFValidationError as e:
            return Response({"error": e.detail}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk, member_id):
        try:
            workspace = get_object_or_404(WorkSpace, pk=pk)
            
            if workspace.owner != request.user:
                return Response({"error": "Only the owner can remove members"}, 
                                status=status.HTTP_403_FORBIDDEN)

            member = get_object_or_404(WorkspaceMember, pk=member_id, workspace=workspace)
            
            if member.user == workspace.owner:
                return Response({"error": "You cannot remove yourself as the owner"}, 
                                status=status.HTTP_400_BAD_REQUEST)

            member.delete()
            return Response({"message": "Member removed"}, status=status.HTTP_204_NO_CONTENT)

        except Exception as e:
            return Response({"error": "Failed to remove member", "details": str(e)}, 
                            status=status.HTTP_400_BAD_REQUEST)