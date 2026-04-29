from django.shortcuts import render
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Notification
from .serializers import NotificationSerializer


class NotificationListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            notifications = Notification.objects.filter(recipient=request.user)
            serializer = NotificationSerializer(notifications, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {"error": "Failed to fetch notifications.", "details": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def patch(self, request, pk=None):
        try:
            if pk:
                notification = Notification.objects.get(pk=pk, recipient=request.user)
                notification.is_read = True
                notification.save()
                return Response(
                    {"message": "Notification marked as read."},
                    status=status.HTTP_200_OK,
                )

            updated_count = Notification.objects.filter(
                recipient=request.user, is_read=False
            ).update(is_read=True)

            return Response(
                {"message": f"All {updated_count} notifications marked as read."},
                status=status.HTTP_200_OK,  
            )

        except Notification.DoesNotExist:
            return Response(
                {"error": "Notification not found or access denied."},
                status=status.HTTP_404_NOT_FOUND,
            )
        except Exception as e:
            return Response(
                {
                    "error": "An error occurred while updating notifications.",
                    "details": str(e),
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
