from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.exceptions import ValidationError as DRFValidationError
from rest_framework.permissions import IsAuthenticated,AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from .serializers import UserSelectSerializer
import os
import requests
import uuid
from django.utils import timezone
from apps.notifications.tasks import process_workspace_invitation_task
from django.conf import settings

from .models import WorkSpace, WorkspaceMember, WorkspaceMessage,WorkspaceInvitation,Meeting
from apps.accounts.models import UserMFA
from rest_framework.parsers import MultiPartParser, FormParser
from .agora_utils import generate_agora_token
from .serializers import (
    WorkspaceMemberSerializer,
    WorkspaceMessageSerializer,
    WorkspaceSerializer,
    WorkspaceMemberSerializer,
    MeetingSerializer
)

User = get_user_model()


class WorkspaceListCreateView(APIView):
    permission_classes = [IsAuthenticated]
    serializer_class = WorkspaceSerializer

    def get(self, request):
        try:
            # Filters workspaces where the current user is a member
            workspaces = WorkSpace.objects.filter(members__user=request.user)
            serializer = self.serializer_class(workspaces, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def post(self, request):
        # 1. Check if MFA is enabled for the user
        try:
            mfa_status = UserMFA.objects.get(user=request.user)
            if not mfa_status.is_enabled:
                return Response(
                    {"error": "MFA must be enabled to create a workspace."}, 
                    status=status.HTTP_403_FORBIDDEN
                )
        except UserMFA.DoesNotExist:
            return Response(
                {"error": "MFA setup is required to create a workspace."}, 
                status=status.HTTP_403_FORBIDDEN
            )

        # 2. Proceed with workspace creation
        serializer = self.serializer_class(data=request.data, context={'request': request})
        if serializer.is_valid():
            # Pass the owner explicitly here
            serializer.save(owner=request.user) 
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)  


class WorkspaceDetailView(APIView):
    permission_classes = [IsAuthenticated]
    serializer_class = WorkspaceSerializer

    def get_object(self, pk, user):
        return get_object_or_404(WorkSpace, pk=pk, members__user=user)

    def get(self, request, pk):
        try:
            workspace = self.get_object(pk, request.user)
            serialzier = self.serializer_class(workspace)
            return Response(serialzier.data, status=status.HTTP_200_OK)

        except Exception:
            return Response(
                {"error": "Workspace not found or access denied"},
                status=status.HTTP_404_NOT_FOUND,
            )

    def put(self, request, pk):
        try:
            workspace = self.get_object(pk, request.user)

            membership = WorkspaceMember.objects.get(
                workspace=workspace, user=request.user
            )

            if membership.role not in ["OWNER", "EDITOR"]:
                return Response(
                    {"error": "You do not have permission to edit this workspace"},
                    status=status.HTTP_403_FORBIDDEN,
                )

            serializer = self.serializer_class(
                workspace, data=request.data, partial=True
            )
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)

        except DRFValidationError as e:
            return Response({"error": e.detail}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        try:
            workspace = self.get_object(pk, request.user)

            if workspace.owner != request.user:
                return Response(
                    {"error": "Only the workspace owner can delete it"},
                    status=status.HTTP_403_FORBIDDEN,
                )

            workspace.delete()
            return Response(
                {"message": "Workspace deleted successfully"},
                status=status.HTTP_204_NO_CONTENT,
            )

        except Exception:
            return Response(
                {"error": "Delete operation failed"}, status=status.HTTP_400_BAD_REQUEST
            )


class MembersListCreateview(APIView):
    permission_classes = [IsAuthenticated]
    serializer_class = WorkspaceMemberSerializer

    def get(self, request, pk):
        try:
            # Verify the requesting user is a member of the workspace
            workspace = get_object_or_404(WorkSpace, pk=pk, members__user=request.user)
            members = workspace.members.all()
            serializer = self.serializer_class(members, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"error": "Unable to fetch members", "details": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def post(self, request, pk):
        try:
            workspace = get_object_or_404(WorkSpace, pk=pk)

            # 1. Security Check: Only the owner can invite
            if workspace.owner != request.user:
                return Response({"error": "Unauthorized. Only the owner can invite members."}, status=status.HTTP_403_FORBIDDEN)

            email = request.data.get('email')
            role = request.data.get('role', 'VIEWER')

            if not email:
                return Response({"error": "Email is required"}, status=status.HTTP_400_BAD_REQUEST)

            # 2. Check if the user is already an active member to prevent IntegrityError
            if WorkspaceMember.objects.filter(workspace=workspace, user__email=email).exists():
                return Response({"error": "This user is already a member of the workspace."}, status=status.HTTP_400_BAD_REQUEST)

            # 3. Create or Refresh the Secure Invitation Token
            # This ensures if a link expired, we generate a fresh one for the same email
            invitation, created = WorkspaceInvitation.objects.update_or_create(
                workspace=workspace,
                email=email,
                defaults={
                    'role': role,
                    'token': uuid.uuid4(),
                    'created_at': timezone.now(),
                    'is_used': False
                }
            )

            # 4. Push Notification Logic (Internal App Notification)
            try:
                recipient = User.objects.filter(email=email).first()
                if recipient:
                    process_workspace_invitation_task.delay(
                        inviter_id=request.user.id,
                        recipient_id=recipient.id,
                        workspace_id=workspace.id
                    )
            except Exception:
                pass 

            # 5. Generate Secure Join URL for n8n/Email
            # The token-based URL ensures only the link holder can access the join flow
            join_url = f" http://127.0.0.1:4000/workspaces/join/{invitation.token}" 

            # Payload for n8n/Email automation
            payload = {
                "email": email,
                "role": role,
                "workspace_name": workspace.name,
                "inviter": request.user.username,
                "join_url": join_url,
                "expires_in": "48 hours"
            }

            # Trigger n8n Webhook
            n8n_url = getattr(settings, 'N8N_WEBHOOK_URL', None)
            if n8n_url:
                try:
                    requests.post(n8n_url, json=payload, timeout=5)
                except requests.exceptions.RequestException:
                    # Log the error if n8n is down but continue the response
                    pass

            return Response({
                "message": "Secure invite sent successfully!",
                "expires": "Link valid for 48 hours"
            }, status=status.HTTP_202_ACCEPTED)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class MembersDetailView(APIView):
    permission_classes = [IsAuthenticated]
    serializer_class = WorkspaceMemberSerializer

    def patch(self, request, pk, member_id):
        try:
            workspace = get_object_or_404(WorkSpace, pk=pk)

            if workspace.owner != request.user:
                return Response(
                    {"error": "Only the owner can modify roles"},
                    status=status.HTTP_403_FORBIDDEN,
                )

            member_record = get_object_or_404(
                WorkspaceMember, pk=member_id, workspace=workspace
            )

            if member_record.user == workspace.owner:
                return Response(
                    {"error": "The owner role cannot be modified"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            serializer = self.serializer_class(
                member_record, data=request.data, partial=True
            )
            serializer.is_valid(raise_exception=True)
            serializer.save()

            return Response(serializer.data, status=status.HTTP_200_OK)

        except DRFValidationError as e:
            return Response({"error": e.detail}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk, member_id):
        try:
            workspace = get_object_or_404(WorkSpace, pk=pk)

            if workspace.owner != request.user:
                return Response(
                    {"error": "Only the owner can remove members"},
                    status=status.HTTP_403_FORBIDDEN,
                )

            member = get_object_or_404(
                WorkspaceMember, pk=member_id, workspace=workspace
            )

            if member.user == workspace.owner:
                return Response(
                    {"error": "You cannot remove yourself as the owner"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            member.delete()
            return Response(
                {"message": "Member removed"}, status=status.HTTP_204_NO_CONTENT
            )

        except Exception as e:
            return Response(
                {"error": "Failed to remove member", "details": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )

class JoinWorkspaceView(APIView):
    permission_classes = [IsAuthenticated] # User must be logged in to join

    def post(self, request, pk):
        workspace = get_object_or_404(WorkSpace, pk=pk)

        # Ensure they aren't already a member
        if WorkspaceMember.objects.filter(workspace=workspace, user=request.user).exists():
            return Response({"detail": "Already a member."}, status=status.HTTP_200_OK)

        # Add them to the workspace
        WorkspaceMember.objects.create(
            workspace=workspace,
            user=request.user,
            role='MEMBER'
        )
        return Response({"detail": "Joined successfully!"}, status=status.HTTP_201_CREATED)            


class WorkspaceChatHistoryView(APIView):
    permission_classes = [IsAuthenticated]
    serializer_class = WorkspaceMessageSerializer

    def get(self, request, pk):
        try:
            workspace = get_object_or_404(WorkSpace, pk=pk, members__user=request.user)

            messages = WorkspaceMessage.objects.filter(workspace=workspace).order_by(
                "timestamp"
            )
            serializer = self.serializer_class(messages, many=True)

            return Response(serializer.data, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {"error": "Chat history not found or access denied", "details": str(e)},
                status=status.HTTP_404_NOT_FOUND,
            )


class AllUsersListView(APIView):
    permission_classes = [IsAuthenticated]
    serializer_class = UserSelectSerializer

    def get(self, request):
        try:
            # Optional: Get workspace ID from query params to exclude existing members
            workspace_id = request.query_params.get('exclude_workspace')
            
            users = User.objects.all().order_by('username')

            if workspace_id:
                # Exclude users who are already members of this specific workspace
                users = users.exclude(workspace_memberships__workspace_id=workspace_id)

            serializer = self.serializer_class(users, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"error": "Failed to fetch user list", "details": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class AcceptInviteView(APIView):
    """
    Finalizes the invitation process by validating the secure token 
    and adding the user to the workspace members list.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, token):
        try:
            # 1. Retrieve the invitation using the unique UUID token
            # We also ensure the token hasn't been used yet
            invitation = get_object_or_404(WorkspaceInvitation, token=token, is_used=False)

            # 2. Security Check: Has the 48-hour window passed?
            if invitation.is_expired():
                return Response(
                    {"error": "This invitation link has expired (48-hour limit). Please ask the owner for a new invite."}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            # 3. Security Check: Does the logged-in user's email match the invite?
            # This prevents users from forwarding invite links to unauthorized people.
            if request.user.email != invitation.email:
                return Response(
                    {"error": "This invitation was sent to a different email address."}, 
                    status=status.HTTP_403_FORBIDDEN
                )

            # 4. Create the Membership
            # We use get_or_create to safely handle accidental double-clicks 
            # and prevent IntegrityErrors.
            member, created = WorkspaceMember.objects.get_or_create(
                workspace=invitation.workspace,
                user=request.user,
                defaults={'role': invitation.role}
            )

            # 5. Mark the token as used so it cannot be reused
            invitation.is_used = True
            invitation.save()

            return Response({
                "message": f"Success! You are now a {invitation.role} of {invitation.workspace.name}.",
                "workspace_id": invitation.workspace.id
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response(
                {"error": "An error occurred while processing the invite.", "details": str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            ) 
        
class WorkspaceMeetTokenView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        workspace = get_object_or_404(WorkSpace, pk=pk, members__user=request.user)
        
        channel_name = f"workspace_{workspace.id}"
        uid = request.user.id
        
        token = generate_agora_token(channel_name, uid)
        

        members = workspace.members.all().select_related('user')
        user_map = {member.user.id: member.user.username for member in members}
        
        return Response({
            "token": token,
            "channel_name": channel_name,
            "uid": uid,
            "app_id": settings.AGORA_APP_ID,
            "user_map": user_map  
        }) 
    
class MeetingUploadView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request, workspace_id):
        # 1. Get the file from React's 'audio' field
        audio_file = request.FILES.get('audio')
        
        if not audio_file:
            return Response({"error": "No audio file provided"}, status=400)

        # --- FIX STARTS HERE ---
        # We must fetch the specific workspace instance first to access its members
        workspace = get_object_or_404(WorkSpace, id=workspace_id, members__user=request.user)

        # Use the lowercase 'workspace' instance variable, NOT the uppercase 'WorkSpace' class
        member_names = [m.user.username for m in workspace.members.all()]
        # --- FIX ENDS HERE ---

        # 2. Save the record
        meeting = Meeting.objects.create(
            workspace=workspace, # Pass the object itself
            host=request.user,
            audio_file=audio_file,
            status='processing'
        )

        # 3. Notify FastAPI AI Service
        ai_url = "http://ai_service:8001/meetings/process" 
        
        payload = {
            "meeting_id": meeting.id,
            "s3_url": meeting.audio_file.url,
            "host_name": request.user.username,
            "workspace_members": member_names
        }
        
        try:
            # Fire and forget
            requests.post(ai_url, json=payload, timeout=0.1)
        except requests.exceptions.ReadTimeout:
            pass
        except Exception as e:
            print(f"Error connecting to AI Service: {e}")

        serializer = MeetingSerializer(meeting)
        return Response(serializer.data, status=201)

class MeetingListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, workspace_id):
        # 1. Verify the user is a member of this workspace
        workspace = get_object_or_404(WorkSpace, id=workspace_id, members__user=request.user)
        
        # 2. Get all meetings for this workspace, ordered by newest first
        meetings = Meeting.objects.filter(workspace=workspace).order_by('-created_at')
        
        # 3. Serialize and return
        serializer = MeetingSerializer(meetings, many=True)
        return Response(serializer.data)        

class MeetingSummaryUpdateView(APIView):
    permission_classes = [AllowAny]
    # This endpoint is called by your FastAPI service
    def patch(self, request, meeting_id):
        try:
            meeting = Meeting.objects.get(id=meeting_id)
            meeting.transcript = request.data.get('transcript')
            meeting.summary = request.data.get('summary')
            meeting.status = 'completed'
            meeting.save()
            return Response({"status": "updated"})
        except Meeting.DoesNotExist:
            return Response({"error": "Meeting not found"}, status=404)             

             