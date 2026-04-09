import os
import sys
from pathlib import Path
from django.core.asgi import get_asgi_application


BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, os.path.join(BASE_DIR, 'apps'))

from channels.routing import ProtocolTypeRouter, URLRouter
from workspaces.routing import websocket_urlpatterns
from workspaces.middleware import JWTAuthMiddleware 

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": JWTAuthMiddleware(
        URLRouter(websocket_urlpatterns)
    ),
})