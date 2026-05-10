from django.urls import path

from .views import (
    MembersDetailView,
    MembersListCreateview,
    WorkspaceChatHistoryView,
    WorkspaceDetailView,
    WorkspaceListCreateView,
    AllUsersListView,
    JoinWorkspaceView,
    AcceptInviteView,
    WorkspaceMeetTokenView,
    MeetingUploadView,
    MeetingSummaryUpdateView,
    MeetingListView
)

urlpatterns = [
    path("", WorkspaceListCreateView.as_view(), name="workspace"),
    path("<int:pk>/", WorkspaceDetailView.as_view(), name="workspace-detail"),
    path(
        "workspace/<int:pk>/members/",
        MembersListCreateview.as_view(),
        name="workspace-members",
    ),
    path(
        "workspace/<int:pk>/members/<int:member_id>/",
        MembersDetailView.as_view(),
        name="workspace-member-detail",
    ),
    path(
        "<int:pk>/messages/",
        WorkspaceChatHistoryView.as_view(),
        name="workspace-chat-history",
    ),
    path('users/all/', AllUsersListView.as_view(), name='all-users-list'),
    path('workspace/<int:pk>/join/', JoinWorkspaceView.as_view(), name='workspace-join'),
    path('workspaces/invite/accept/<uuid:token>/', AcceptInviteView.as_view(), name='accept-invite'),
    path('<int:pk>/meet-token/', WorkspaceMeetTokenView.as_view(), name='workspace-meet-token'),

    path('<int:workspace_id>/process-meeting/', MeetingUploadView.as_view(), name='process-meeting'),
    path('meetings/<int:meeting_id>/update-summary/', MeetingSummaryUpdateView.as_view(), name='update-summary'),
    path('<int:workspace_id>/meetings/', MeetingListView.as_view(), name='meeting-list')
]
