from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from .serializers import AdminUserSerializer
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta

User = get_user_model()

class AdminDashboardStatsView(APIView):
 
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        try:
            now = timezone.now()
            last_24h = now - timedelta(hours=24)

            stats = {
                "user_metrics": {
                    "total_users": User.objects.count(),
                    "new_users_24h": User.objects.filter(date_joined__gte=last_24h).count(),
                    "active_staff": User.objects.filter(is_staff=True).count(),
                },
                "system_status": {
                    "db_connection": "Healthy",  # Logic can be expanded for Docker health checks
                    "server_time": now.strftime("%Y-%m-%d %H:%M:%S"),
                },
                # Example for workspace activity if you have a Workspace model
                # "workspace_metrics": {
                #     "total_workspaces": Workspace.objects.count(),
                # }
            }
            return Response(stats, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"error": "Failed to load dashboard stats", "detail": str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class AdminUserManagementView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        try:
            users = User.objects.all().order_by('-id')
            serializer = AdminUserSerializer(users, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def patch(self, request, pk):
        user = User.objects.get(pk=pk)
        serializer = AdminUserSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)