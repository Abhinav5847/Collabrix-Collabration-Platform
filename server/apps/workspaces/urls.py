from django.urls import path

from .views import (
    MembersDetailView,
    MembersListCreateview,
    WorkspaceDetailView,
    WorkspaceListCreateView,
)

urlpatterns = [
    path("", WorkspaceListCreateView.as_view(), name="workspace"),
    path("<int:pk>/", WorkspaceDetailView.as_view(), name="workspace_details"),
    path(
        "workspace/<int:pk>/members/", MembersListCreateview.as_view(), name="members"
    ),
    path(
        "workspace/<int:pk>/members/<int:member_id>/",
        MembersDetailView.as_view(),
        name="members_details",
    ),
]
