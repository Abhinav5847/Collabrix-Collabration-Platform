from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient, APITestCase

from apps.workspaces.models import WorkSpace, WorkspaceMember

from .models import Document

User = get_user_model()


class DocumentAPITest(APITestCase):
    def setUp(self):
        self.client = APIClient()

        self.user = User.objects.create_user(
            username="testuser", email="user@test.com", password="password123"
        )

        self.other_user = User.objects.create_user(
            username="otheruser", email="other@test.com", password="password123"
        )

        self.viewer_user = User.objects.create_user(
            username="viewer", email="viewer@test.com", password="password123"
        )

        self.client.force_authenticate(user=self.user)

        self.workspace = WorkSpace.objects.create(
            name="Test Workspace", owner=self.user
        )

        WorkspaceMember.objects.get_or_create(
            workspace=self.workspace, user=self.user, defaults={"role": "OWNER"}
        )

        WorkspaceMember.objects.create(
            workspace=self.workspace, user=self.other_user, role="EDITOR"
        )

        WorkspaceMember.objects.create(
            workspace=self.workspace, user=self.viewer_user, role="VIEWER"
        )

        self.document = Document.objects.create(
            title="Test Doc",
            content="Test Content",
            workspace=self.workspace,
            creator=self.user,
        )

    #  document list
    def test_get_documents(self):
        url = reverse("document-list-create", args=[self.workspace.id])

        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_get_documents_not_member(self):
        new_user = User.objects.create_user(username="outsider", password="pass")

        self.client.force_authenticate(user=new_user)

        url = reverse("document-list-create", args=[self.workspace.id])
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    #   document create
    def test_create_document_success(self):
        url = reverse("document-list-create", args=[self.workspace.id])

        data = {"title": "New Doc", "content": "Some content"}

        response = self.client.post(url, data)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_create_document_viewer_forbidden(self):
        self.client.force_authenticate(user=self.viewer_user)

        url = reverse("document-list-create", args=[self.workspace.id])

        response = self.client.post(
            url, {"title": "Fail Doc", "content": "No permission"}
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    # document detail
    def test_get_document(self):
        url = reverse("document-detail", args=[self.document.id])

        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_update_document_as_editor(self):
        self.client.force_authenticate(user=self.other_user)

        url = reverse("document-detail", args=[self.document.id])

        response = self.client.put(url, {"title": "Updated"})

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_update_document_viewer_forbidden(self):
        self.client.force_authenticate(user=self.viewer_user)

        url = reverse("document-detail", args=[self.document.id])

        response = self.client.put(url, {"title": "Hack"})

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_delete_document(self):
        url = reverse("document-detail", args=[self.document.id])

        response = self.client.delete(url)

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_delete_document_viewer_forbidden(self):
        self.client.force_authenticate(user=self.viewer_user)

        url = reverse("document-detail", args=[self.document.id])

        response = self.client.delete(url)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    #   trash list
    def test_get_trash_documents(self):
        self.document.soft_delete()

        url = reverse("document-trash", args=[self.workspace.id])

        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_restore_document(self):
        self.document.soft_delete()

        url = reverse("document-restore", args=[self.document.id])

        response = self.client.post(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_restore_document_viewer_forbidden(self):
        self.document.soft_delete()

        self.client.force_authenticate(user=self.viewer_user)

        url = reverse("document-restore", kwargs={"pk": self.document.id})

        response = self.client.post(url)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_permanent_delete_owner_only(self):
        self.document.soft_delete()

        url = reverse("document-permanent-delete", args=[self.document.id])

        response = self.client.delete(url)

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_permanent_delete_not_owner(self):
        self.document.soft_delete()

        self.client.force_authenticate(user=self.other_user)

        url = reverse("document-permanent-delete", args=[self.document.id])

        response = self.client.delete(url)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
