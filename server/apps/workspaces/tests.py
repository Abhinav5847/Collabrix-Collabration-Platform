from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.contrib.auth import get_user_model

from .models import WorkSpace, WorkspaceMember

User = get_user_model()


class WorkspaceAPITest(APITestCase):
    def setUp(self):
        self.client = APIClient()

        self.user = User.objects.create_user(
           username="testuser",email="user@test.com", password="password123"
        )
        self.other_user = User.objects.create_user(
            username="otheruser",
            email="other@test.com", password="password123"
        )

        self.client.force_authenticate(user=self.user)

        self.workspace = WorkSpace.objects.create(
            name="Test Workspace",
            owner=self.user
        )

        self.owner_membership, _ = WorkspaceMember.objects.get_or_create(
        workspace=self.workspace,
        user=self.user,
        defaults={"role": "OWNER"}
)

    def test_get_workspaces(self):
        url = reverse("workspace")
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)   

    def test_create_workspace_success(self):
        url = reverse("workspace")
        data = {"name": "New Workspace"}

        response = self.client.post(url, data)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["name"], "New Workspace")

    def test_create_workspace_invalid(self):
        url = reverse("workspace")

        response = self.client.post(url, {})

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

   
    def test_get_workspace(self):
        url = reverse("workspace-detail", args=[self.workspace.id])
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_update_workspace_as_owner(self):
        url = reverse("workspace-detail", args=[self.workspace.id])
        data = {"name": "Updated Name"}

        response = self.client.put(url, data)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.workspace.refresh_from_db()
        self.assertEqual(self.workspace.name, "Updated Name")

    def test_update_workspace_without_permission(self):
        WorkspaceMember.objects.create(
            workspace=self.workspace,
            user=self.other_user,
            role="VIEWER"
        )

        self.client.force_authenticate(user=self.other_user)

        url = reverse("workspace-detail", args=[self.workspace.id])
        response = self.client.put(url, {"name": "Hack"})

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_delete_workspace_as_owner(self):
        url = reverse("workspace-detail", args=[self.workspace.id])

        response = self.client.delete(url)

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_delete_workspace_not_owner(self):
        WorkspaceMember.objects.create(
            workspace=self.workspace,
            user=self.other_user,
            role="EDITOR"
        )

        self.client.force_authenticate(user=self.other_user)

        url = reverse("workspace-detail", args=[self.workspace.id])
        response = self.client.delete(url)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_get_members(self):
        url = reverse("workspace-members", args=[self.workspace.id])

        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_add_member_success(self):
        url = reverse("workspace-members", args=[self.workspace.id])

        data = {
            "user_id": self.other_user.id,
            "role": "VIEWER"
        }

        response = self.client.post(url, data)

        print(response.data)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_add_member_not_owner(self):
        WorkspaceMember.objects.create(
            workspace=self.workspace,
            user=self.other_user,
            role="EDITOR"
        )

        self.client.force_authenticate(user=self.other_user)

        url = reverse("workspace-members", args=[self.workspace.id])
        data = {"user": self.user.id, "role": "VIEWER"}

        response = self.client.post(url, data)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_add_existing_member(self):
        WorkspaceMember.objects.create(
            workspace=self.workspace,
            user=self.other_user,
            role="VIEWER"
        )

        url = reverse("workspace-members", args=[self.workspace.id])
        data = {"user": self.other_user.id, "role": "VIEWER"}

        response = self.client.post(url, data)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


    def test_update_member_role(self):
        member = WorkspaceMember.objects.create(
            workspace=self.workspace,
            user=self.other_user,
            role="VIEWER"
        )

        url = reverse(
            "workspace-member-detail",
            args=[self.workspace.id, member.id]
        )

        response = self.client.patch(url, {"role": "EDITOR"})

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_update_member_not_owner(self):
        member = WorkspaceMember.objects.create(
            workspace=self.workspace,
            user=self.other_user,
            role="VIEWER"
        )

        self.client.force_authenticate(user=self.other_user)

        url = reverse(
            "workspace-member-detail",
            args=[self.workspace.id, member.id]
        )

        response = self.client.patch(url, {"role": "EDITOR"})

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_delete_member(self):
        member = WorkspaceMember.objects.create(
            workspace=self.workspace,
            user=self.other_user,
            role="VIEWER"
        )

        url = reverse(
            "workspace-member-detail",
            args=[self.workspace.id, member.id]
        )

        response = self.client.delete(url)

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_delete_owner_not_allowed(self):
        owner_member = WorkspaceMember.objects.get(user=self.user)

        url = reverse(
            "workspace-member-detail",
            args=[self.workspace.id, owner_member.id]
        )

        response = self.client.delete(url)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)      


