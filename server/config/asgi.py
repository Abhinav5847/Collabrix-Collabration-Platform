import os
import sys
from pathlib import Path

from django.core.asgi import get_asgi_application
from channels.security.websocket import AllowedHostsOriginValidator

# 1. Ensure the path is set so it matches settings.py
BASE_DIR = Path(__file__).resolve().parent.parent
if os.path.join(BASE_DIR, "apps") not in sys.path:
    sys.path.insert(0, os.path.join(BASE_DIR, "apps"))

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

# 2. Initialize the Django ASGI application FIRST
# This loads the App Registry and makes models available
django_asgi_app = get_asgi_application()

# 3. NOW import your custom code that depends on models/tasks
from channels.routing import ProtocolTypeRouter, URLRouter
from workspaces.middleware import JWTAuthMiddleware
from workspaces.routing import websocket_urlpatterns


application = ProtocolTypeRouter(
    {
        "http": django_asgi_app,
        "websocket": AllowedHostsOriginValidator(  
            JWTAuthMiddleware(
                URLRouter(websocket_urlpatterns)
            )
        ),
    }
)
# application = ProtocolTypeRouter(
#     {
#         "http": django_asgi_app,
#         "websocket": JWTAuthMiddleware(URLRouter(websocket_urlpatterns)),
#     }
# )
