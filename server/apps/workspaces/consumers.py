import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import WorkSpace, WorkspaceMessage

class WorkspaceChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.workspace_id = self.scope["url_route"]["kwargs"]["workspace_id"]
        self.room_group_name = f"chat_{self.workspace_id}"
        self.user = self.scope.get("user")

        print(f"🔌 WS Attempt: User {self.user} -> Workspace {self.workspace_id}")

        if self.user and self.user.is_authenticated:
            # Join room group
            await self.channel_layer.group_add(
                self.room_group_name,
                self.channel_name
            )
            await self.accept()
            print(f"✅ WS Connected: {self.user.email}")
        else:
            print(f"🚫 WS Rejected: Anonymous User")
            await self.close()

    async def disconnect(self, close_code):
        # Leave room group
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )
        print(f"❌ WS Disconnected: Code {close_code}")

    async def receive(self, text_data):
        """
        Called when React sends a message.
        """
        try:
            data = json.loads(text_data)
            message_text = data.get("message")

            if not message_text:
                return

            # 1. PERSISTENCE: Save to PostgreSQL
            await self.save_message(message_text)

            # 2. REAL-TIME: Broadcast to others in the room
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "chat_message",
                    "message": message_text,
                    "sender": self.user.email,
                }
            )
        except Exception as e:
            print(f"⚠️ Receive Error: {e}")

    @database_sync_to_async
    def save_message(self, content):
        """
        Saves the message to the WorkspaceMessage model.
        """
        try:
            # Get the workspace instance
            workspace = WorkSpace.objects.get(id=self.workspace_id)
            
            # Create the message record
            return WorkspaceMessage.objects.create(
                workspace=workspace,
                user=self.user,
                content=content
            )
        except WorkSpace.DoesNotExist:
            print(f"❌ Error: Workspace {self.workspace_id} not found.")
        except Exception as e:
            print(f"❌ Database Save Error: {e}")

    async def chat_message(self, event):
        """
        Sends the broadcasted message to the browser.
        """
        await self.send(text_data=json.dumps({
            "message": event["message"],
            "sender": event["sender"],
        }))