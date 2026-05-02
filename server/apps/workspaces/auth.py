from rest_framework import authentication
from rest_framework import exceptions
from django.conf import settings
from django.contrib.auth import get_user_model

User = get_user_model()

class InternalAgentAuthentication(authentication.BaseAuthentication):
    def authenticate(self, request):
        # Check for the secret key in headers
        secret = request.headers.get('X-Internal-Secret') or request.META.get('HTTP_X_INTERNAL_SECRET')
        
        if not secret or secret != settings.INTERNAL_SECRET:
            return None 

        # Support user identification via Header, Query Param, or Body
        user_id = (
            request.headers.get('X-Agent-User-ID') or 
            request.query_params.get('user_id') or 
            (request.data.get('user_id') if hasattr(request, 'data') else None)
        )
        
        if not user_id:
            return None

        try:
            user = User.objects.get(pk=user_id, is_active=True)
            return (user, None)
        except User.DoesNotExist:
            raise exceptions.AuthenticationFailed('Agent target user not found')