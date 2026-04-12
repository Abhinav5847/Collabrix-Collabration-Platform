from django.urls import path

from .views import DocumentDetailView, DocumentListCreateView, DocumentTrashView

urlpatterns = [
    path(
        "workspaces/<int:workspace_id>/document/",
        DocumentListCreateView.as_view(),
        name="document-list-create",
    ),
    path("documents/<int:pk>/", DocumentDetailView.as_view(), name="document-detail"),
    path(
        "workspaces/<int:workspace_id>/trash/",
        DocumentTrashView.as_view(),
        name="document-trash",
    ),
    path(
        "documents/<int:pk>/restore/",
        DocumentTrashView.as_view(),
        name="document-restore",
    ),
    path(
        "documents/<int:pk>/permanent-delete/",
        DocumentTrashView.as_view(),
        name="document-permanent-delete",
    ),
]
