from django.urls import re_path

from apps.notifications import consumers as notif_consumers
from apps.workspaces import consumers as chat_consumers

websocket_urlpatterns = [
    re_path(
        r"ws/chat/(?P<workspace_id>\d+)/$",
        chat_consumers.WorkspaceChatConsumer.as_asgi(),
    ),
    re_path(r"ws/notifications/$", notif_consumers.NotificationConsumer.as_asgi()),
]
