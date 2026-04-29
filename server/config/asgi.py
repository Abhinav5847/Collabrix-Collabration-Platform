import os
import sys
from pathlib import Path
from django.core.asgi import get_asgi_application

# 1. SETUP PATHS
# Ensure 'apps' is in the python path so imports work correctly inside Docker
BASE_DIR = Path(__file__).resolve().parent.parent
apps_path = str(BASE_DIR / "apps")
if apps_path not in sys.path:
    sys.path.insert(0, apps_path)

# 2. CONFIGURE DJANGO & INITIALIZE ASGI
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
# Important: Initialize the Django ASGI app BEFORE importing local apps/routing
django_asgi_app = get_asgi_application()

# 3. LOCAL IMPORTS (These must come AFTER django_asgi_app)
from channels.routing import ProtocolTypeRouter, URLRouter
from apps.workspaces.middleware import JWTAuthMiddleware 
from apps.workspaces.routing import websocket_urlpatterns 

# 4. DEFINE APPLICATION
application = ProtocolTypeRouter(
    {
        # Handles standard HTTP requests
        "http": django_asgi_app,
        
        # Handles WebSocket connections with our Custom Cookie-JWT Middleware
        "websocket": JWTAuthMiddleware(
            URLRouter(websocket_urlpatterns)
        ),
    }
)