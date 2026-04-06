from django.urls import path
from .views import DocumentListCreateView

urlpatterns = [
   path('workspaces/<int:workspace_id>/document/',DocumentListCreateView.as_view(),name='documents')
]