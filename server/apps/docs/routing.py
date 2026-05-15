from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    # This regex matches 'ws/document/DIGITS/'
    re_path(r'ws/document/(?P<pk>\d+)/$', consumers.DocumentConsumer.as_asgi()),
]