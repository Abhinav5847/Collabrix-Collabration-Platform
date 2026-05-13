from django.urls import path
from .views import AdminFullManagementView,ToggleUserStatusView,AdminWorkspaceDetailView

urlpatterns = [
    # Dashboard Stats
   path('admin/manage-all/', AdminFullManagementView.as_view(), name='admin-manage-all'),
   path('admin/users/<int:user_id>/toggle/', ToggleUserStatusView.as_view(), name='admin-toggle-user'),
   path('admin/workspaces/<int:workspace_id>/', AdminWorkspaceDetailView.as_view(), name='admin-workspace-detail'),
   
    
    # User Management
    # path('users/', AdminUserManagementView.as_view(), name='admin-user-list'),
    # path('users/<int:pk>/', AdminUserManagementView.as_view(), name='admin-user-detail'),
]