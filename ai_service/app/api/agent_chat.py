from fastapi import APIRouter, Request, Depends, HTTPException
from app.agent.auth import get_current_user
from app.agent.engine import collabrix_agent  # Assuming this is your agent instance

router = APIRouter()

@router.post("/chat")
async def agent_chat(request: Request, payload: dict, user_id: str = Depends(get_current_user)):
 
    access_token = request.cookies.get("access_token")
    
    if not access_token:
        raise HTTPException(status_code=401, detail="Access token missing from cookies")

    config = {
        "configurable": {
            "user_id": user_id,
            "access_token": access_token,
            "thread_id": f"user_{user_id}" 
        }
    }

    try:
        user_message = payload.get("message")
        if not user_message:
            raise HTTPException(status_code=400, detail="No message provided")

     
        result = await collabrix_agent.ainvoke(
            {"messages": [("user", user_message)]}, 
            config=config
        )
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))