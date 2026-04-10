import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async

class WorkspaceChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.workspace_id = self.scope['url_route']['kwargs']['workspace_id']
        self.room_group_name = f'chat_{self.workspace_id}'

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        data = json.loads(text_data)
        message_content = data.get('message')
        user = self.scope['user']

        if user.is_authenticated and message_content:
            await self.save_message(user, self.workspace_id, message_content)

            from apps.notifications.tasks import process_chat_mention_task
            process_chat_mention_task.delay(message_content, user.id, self.workspace_id)

            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat_message',
                    'message': message_content,
                    'sender': user.email
                }
            )

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            'message': event['message'],
            'sender': event['sender']
        }))

    @database_sync_to_async
    def save_message(self, user, workspace_id, content):
        from apps.workspaces.models import WorkSpace, WorkspaceMessage
        workspace = WorkSpace.objects.get(id=workspace_id)
        return WorkspaceMessage.objects.create(
            workspace=workspace,
            user=user,
            content=content
        )