from langchain_core.runnables import RunnableConfig
from langchain.tools import tool
import httpx
from app.core.config import settings

@tool
async def create_workspace(name: str, config: RunnableConfig):
    """
    Create a new collaborative workspace in Collabrix.
    
    Args:
        name: The name of the workspace to be created.
        config: Configuration containing the user's authentication details.
    """

    user_id = config.get("configurable", {}).get("user_id")
    access_token = config.get("configurable", {}).get("access_token")
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                f"{settings.DRF_INTERNAL_URL}/api/workspaces/",
                json={"name": name},
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "X-Internal-Secret": settings.INTERNAL_SECRET,
                    "X-Agent-User-ID": str(user_id)
                }
            )

        if response.status_code == 201:
            data = response.json()
            return f"✅ SUCCESS: Workspace '{name}' created (ID: {data.get('id')})."
        
        return f"❌ FAILED: Backend returned {response.status_code}. Do not retry."

    except Exception as e:
        return f"❌ ERROR: Connection failed. {str(e)}"

# Add any additional tools to this list
GLOBAL_TOOLS = [create_workspace]