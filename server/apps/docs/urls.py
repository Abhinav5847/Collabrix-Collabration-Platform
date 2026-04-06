from django.urls import path
from .views import DocumentListCreateView,DocumentDetailView

urlpatterns = [
   path('workspaces/<int:workspace_id>/document/',DocumentListCreateView.as_view(),name='documents'),
   path('documents/<int:pk>/',DocumentDetailView.as_view(),name='documents_details')
]