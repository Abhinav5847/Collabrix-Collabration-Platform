from django.urls import path

from .views import DocumentDetailView, DocumentListCreateView, DocumentTrashView

urlpatterns = [
    path(
        "workspaces/<int:workspace_id>/document/",
        DocumentListCreateView.as_view(),
        name="documents",
    ),
    path("documents/<int:pk>/", DocumentDetailView.as_view(), name="documents_details"),
    path(
        "workspaces/<int:workspace_id>/trash/",
        DocumentTrashView.as_view(),
        name="trash_list",
    ),
    path("documents/<int:pk>/trash/", DocumentTrashView.as_view(), name="trash"),
]
