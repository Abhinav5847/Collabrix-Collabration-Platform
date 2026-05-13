from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from django.shortcuts import get_object_or_404

from apps.workspaces.models import WorkSpace, WorkspaceMember, Meeting
from apps.workspaces.serializers import WorkspaceSerializer
from apps.docs.models import Document

User = get_user_model()

class AdminFullManagementView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        try:
            now = timezone.now()
            last_24h = now - timedelta(hours=24)

            filtered_users = User.objects.filter(is_verified=True, is_staff=False)

            users_list = filtered_users.values(
                'id', 'username', 'email', 'is_active', 'date_joined'
            ).order_by('-date_joined')[:50]

            workspaces_list = WorkSpace.objects.all().values(
                'id', 'name', 'owner__email', 'created_at','is_active'
            ).order_by('-created_at')

            docs_list = Document.objects.filter(is_deleted=False).values(
                'id', 'title', 'workspace__name', 'creator__email', 'created_at'
            ).order_by('-created_at')


            stats = {
                "users": {
                    "total": filtered_users.count(),
                    "new_24h": filtered_users.filter(date_joined__gte=last_24h).count()
                },
                "workspaces": {"total": WorkSpace.objects.count()},
                "docs": {"total": Document.objects.count()},
                "meetings": {"total": Meeting.objects.count()}
            }

            return Response({
                "stats": stats,
                "management": {
                    "users": list(users_list),
                    "workspaces": list(workspaces_list),
                    "documents": list(docs_list)
                }
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
class AdminWorkspaceDetailView(APIView):
    """
    Admin-only endpoint to View, Edit, and Soft-Delete any workspace.
    """
    permission_classes = [permissions.IsAdminUser]

    def get(self, request, workspace_id):
        # Admin can view any workspace, regardless of membership
        workspace = get_object_or_404(WorkSpace, id=workspace_id)
        serializer = WorkspaceSerializer(workspace)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, workspace_id):
        # Admin can edit workspace details (like name)
        workspace = get_object_or_404(WorkSpace, id=workspace_id)
        serializer = WorkspaceSerializer(workspace, data=request.data, partial=True)
        
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, workspace_id):
    # Soft delete toggle: Switch is_active status
     workspace = get_object_or_404(WorkSpace, id=workspace_id)
    
    # Flip the status: if True becomes False, if False becomes True
     workspace.is_active = not workspace.is_active
     workspace.save()
    
     action = "archived" if not workspace.is_active else "restored"
    
     return Response({
        "message": f"Workspace {action} successfully.",
        "id": workspace_id,
        "is_active": workspace.is_active
     }, status=status.HTTP_200_OK)      
        

class ToggleUserStatusView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def post(self, request, user_id):
        try:
            user_to_toggle = User.objects.get(id=user_id)
            
            if user_to_toggle == request.user:
                return Response({"error": "You cannot deactivate yourself."}, status=status.HTTP_400_BAD_REQUEST)
            
            user_to_toggle.is_active = not user_to_toggle.is_active
            user_to_toggle.save()
            
            return Response({
                "is_active": user_to_toggle.is_active,
                "message": f"User {'activated' if user_to_toggle.is_active else 'deactivated'} successfully"
            }, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)