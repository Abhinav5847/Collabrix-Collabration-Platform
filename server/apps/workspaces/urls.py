from django.urls import path
from .views import WorkspaceDetailView,WorkspaceListCreateView

urlpatterns = [
     path('',WorkspaceListCreateView.as_view(),name='workspace'),
     path('<slug:slug>/',WorkspaceDetailView.as_view(),name='workspace_details'),
]