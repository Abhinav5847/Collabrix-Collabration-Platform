from django.urls import path
from .views import AdminFullManagementView,ToggleUserStatusView

urlpatterns = [
    # Dashboard Stats
   path('admin/manage-all/', AdminFullManagementView.as_view(), name='admin-manage-all'),
   path('admin/users/<int:user_id>/toggle/', ToggleUserStatusView.as_view(), name='admin-toggle-user'),
   
    
    # User Management
    # path('users/', AdminUserManagementView.as_view(), name='admin-user-list'),
    # path('users/<int:pk>/', AdminUserManagementView.as_view(), name='admin-user-detail'),
]