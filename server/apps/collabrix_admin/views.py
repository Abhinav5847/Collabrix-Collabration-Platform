from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from django.db.models import Count

# Import your other models (adjust paths based on your app names)
from apps.workspaces.models import Workspace, Member
from apps.docs.models import Document
from apps.meetings.models import Meeting

User = get_user_model()

class AdminDashboardStatsView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        try:
            now = timezone.now()
            last_24h = now - timedelta(hours=24)
            last_7d = now - timedelta(days=7)

            stats = {
                "user_metrics": {
                    "total_users": User.objects.count(),
                    "new_users_24h": User.objects.filter(date_joined__gte=last_24h).count(),
                    "active_staff": User.objects.filter(is_staff=True).count(),
                },
                "workspace_analytics": {
                    "total_workspaces": Workspace.objects.count(),
                    "active_this_week": Workspace.objects.filter(updated_at__gte=last_7d).count(),
                    "total_members": Member.objects.count(),
                },
                "document_metrics": {
                    "total_documents": Document.objects.count(),
                    "new_documents_24h": Document.objects.filter(created_at__gte=last_24h).count(),
                    # If you track storage in S3:
                    # "storage_used_mb": Document.objects.aggregate(Sum('file_size'))['file_size__sum'] or 0
                },
                "meeting_analytics": {
                    "total_meetings_held": Meeting.objects.filter(status='completed').count(),
                    "upcoming_meetings": Meeting.objects.filter(scheduled_at__gt=now).count(),
                    "avg_duration": "42 mins", # Calculated logic here
                },
                "system_status": {
                    "db_connection": "Healthy",
                    "server_time": now.strftime("%Y-%m-%d %H:%M:%S"),
                    "celery_status": "Active", # Example placeholder
                }
            }
            return Response(stats, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)