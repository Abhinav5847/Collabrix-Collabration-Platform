import json
from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer

class WorkspaceChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.workspace_id = self.scope["url_route"]["kwargs"]["workspace_id"]
        self.room_group_name = f"chat_{self.workspace_id}"
        self.user = self.scope.get("user")

        if self.user and self.user.is_authenticated:
            await self.channel_layer.group_add(self.room_group_name, self.channel_name)
            await self.accept()
        else:
            # Reject connection if user is not logged in
            await self.close()

    async def disconnect(self, close_code):
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        message_content = data.get("message")
        user = self.scope["user"]

        if user.is_authenticated and message_content:
            # 1. Save to Database
            await self.save_message(user, self.workspace_id, message_content)

            # 2. Trigger Mention Task (Corrected Path)
            try:
                # We point this to where your task file is actually located
                from apps.notifications.tasks import process_chat_mention_task
                process_chat_mention_task.delay(message_content, user.id, self.workspace_id)
            except ImportError as e:
                print(f"❌ Could not find task in apps.notifications.tasks: {e}")

            # 3. Broadcast Live to Room
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "chat_message",
                    "message": message_content,
                    "sender": user.email,
                },
            )

    async def chat_message(self, event):
        """Sends the message to the React frontend."""
        await self.send(
            text_data=json.dumps(
                {"message": event["message"], "sender": event["sender"]}
            )
        )

    @database_sync_to_async
    def save_message(self, user, workspace_id, content):
        # Local imports inside the method prevent circular dependency issues
        from apps.workspaces.models import WorkSpace, WorkspaceMessage

        try:
            workspace = WorkSpace.objects.get(id=workspace_id)
            return WorkspaceMessage.objects.create(
                workspace=workspace, 
                user=user, 
                content=content
            )
        except Exception as e:
            print(f"❌ Database error in save_message: {e}")
            return None