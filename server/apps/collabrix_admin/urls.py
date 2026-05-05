from django.urls import path
from .views import AdminUserManagementView, AdminDashboardStatsView

urlpatterns = [
    # Dashboard Stats
    path('dashboard/stats/', AdminDashboardStatsView.as_view(), name='admin-stats'),
    
    # User Management
    path('users/', AdminUserManagementView.as_view(), name='admin-user-list'),
    path('users/<int:pk>/', AdminUserManagementView.as_view(), name='admin-user-detail'),
]