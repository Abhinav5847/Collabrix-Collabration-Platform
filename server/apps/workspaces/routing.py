from django.urls import re_path
# Use absolute paths to avoid naming conflicts
from apps.workspaces import consumers as chat_consumers
from apps.notifications import consumers as notif_consumers

websocket_urlpatterns = [
    # Explicitly using the renamed imports
    re_path(
        r'^ws/chat/(?P<workspace_id>\d+)/$', 
        chat_consumers.WorkspaceChatConsumer.as_asgi()
    ),

    re_path(
        r'^ws/notifications/$', 
        notif_consumers.NotificationConsumer.as_asgi()
    ),
]