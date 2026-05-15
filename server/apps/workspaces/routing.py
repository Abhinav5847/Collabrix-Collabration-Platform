from django.urls import re_path
from apps.notifications import consumers as notif_consumers
from apps.workspaces import consumers as chat_consumers
# Import your document consumer
from apps.docs import consumers as doc_consumers 

websocket_urlpatterns = [
    # 1. Workspace Chat
    re_path(
        r"ws/chat/(?P<workspace_id>\d+)/$",
        chat_consumers.WorkspaceChatConsumer.as_asgi(),
    ),
    
    # 2. Notifications
    re_path(r"ws/notifications/$", notif_consumers.NotificationConsumer.as_asgi()),
    
    # 3. Document Sync (The new addition)
    re_path(
        r"ws/document/(?P<pk>\d+)/$", 
        doc_consumers.DocumentConsumer.as_asgi()
    ),
]