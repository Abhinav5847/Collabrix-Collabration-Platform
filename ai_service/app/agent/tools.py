from langchain.tools import tool
import httpx
from app.core.config import settings


@tool
async def create_workspace(name: str, user_id: int):
    """
    Create a new workspace.

    Use this tool when the user wants to create a workspace.
    
    Inputs:
    - name: Name of the workspace
    - user_id: ID of the user creating the workspace

    Returns:
    - Success or failure message
    """
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                f"{settings.DRF_INTERNAL_URL}/workspaces/",
                json={
                    "name": name,
                    "user_id": user_id
                },
                headers={
                    "X-Internal-Secret": settings.INTERNAL_SECRET
                }
            )

        if response.status_code == 201:
            data = response.json()
            return f"✅ Workspace '{name}' created successfully. ID: {data.get('id')}"
        
        return f"❌ Failed to create workspace. Status: {response.status_code}"

    except httpx.RequestError as e:
        return f"❌ Network error while creating workspace: {str(e)}"

    except Exception as e:
        return f"❌ Unexpected error: {str(e)}"


@tool
async def invite_member_to_workspace(workspace_id: int, user_email: str):
    """
    Invite a user to a workspace.

    Use this tool when the user wants to invite someone to a workspace.

    Inputs:
    - workspace_id: ID of the workspace
    - user_email: Email of the user to invite

    Returns:
    - Success or failure message
    """
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                f"{settings.DRF_INTERNAL_URL}/api/workspaces/{workspace_id}/members/",
                json={"email": user_email},
                headers={
                    "X-Internal-Secret": settings.INTERNAL_SECRET
                }
            )

        if response.status_code == 201:
            return f"✅ Invitation sent to {user_email}"
        
        return f"❌ Invitation failed. Status: {response.status_code}"

    except httpx.RequestError as e:
        return f"❌ Network error while inviting member: {str(e)}"

    except Exception as e:
        return f"❌ Unexpected error: {str(e)}"


# 🔥 Global tools list for agent
GLOBAL_TOOLS = [
    create_workspace,
    invite_member_to_workspace
]