import json
from channels.generic.websocket import AsyncWebsocketConsumer

class DocumentConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.doc_id = self.scope['url_route']['kwargs']['pk']
        self.room_group_name = f'doc_{self.doc_id}'
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'doc_update',
                'title': data.get('title'),
                'content': data.get('content'),
                'sender_id': data.get('sender_id') 
            }
        )

    async def doc_update(self, event):
        # Send to the frontend WebSocket
        await self.send(text_data=json.dumps({
            'title': event['title'],
            'content': event['content'],
            'sender_id': event['sender_id']
        }))