from http.cookies import SimpleCookie
from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
from channels.db import database_sync_to_async
from rest_framework_simplejwt.tokens import AccessToken

User = get_user_model()

@database_sync_to_async
def get_user_from_token(token_key):
    try:
        token = AccessToken(token_key)
        # Fetching by the ID stored in the JWT payload
        user_id = token.get("user_id") or token.get("id")
        return User.objects.get(id=user_id)
    except Exception as e:
        # This will show up in your 'django_backend' terminal if the token is invalid/expired
        print(f"❌ JWT Middleware Auth Error: {e}")
        return AnonymousUser()

class JWTAuthMiddleware:
    def __init__(self, inner):
        self.inner = inner

    async def __call__(self, scope, receive, send):
        token_key = None
        
        # Headers in Channels are a list of tuples: [(b'host', b'127.0.0.1'), ...]
        headers = dict(scope.get('headers', []))

        # 1. Extract from Cookie header
        if b'cookie' in headers:
            try:
                cookies = SimpleCookie()
                cookies.load(headers[b'cookie'].decode())
                
                # Get cookie name from settings, fallback to 'access_token'
                cookie_name = getattr(settings, 'SIMPLE_JWT', {}).get('AUTH_COOKIE', 'access_token')
                
                if cookie_name in cookies:
                    token_key = cookies[cookie_name].value
            except Exception as e:
                print(f"⚠️ Cookie Parsing Error: {e}")

        # 2. Final User Assignment
        if token_key:
            scope["user"] = await get_user_from_token(token_key)
        else:
            # If you see this, Nginx isn't passing the cookie or the browser isn't sending it
            print("⚠️ No access_token cookie found in WS headers")
            scope["user"] = AnonymousUser()

        return await self.inner(scope, receive, send)