from fastapi import APIRouter, Body, HTTPException, Request
from app.vector.qdrant import upsert_document
from app.ai.rag import run_rag 
from app.services.memory import get_history, save_message 
from app.core.limiter import limiter  
import os

router = APIRouter()

@router.post("/ai/ingest")
@limiter.limit("10/minute")
async def ingest_from_celery(request: Request, payload: dict = Body(...)):
    try:
        upsert_document(
            text=payload.get("text"),
            workspace_id=str(payload.get("workspace_id")),
            doc_id=str(payload.get("doc_id"))
        )
        return {"status": "synced"}
    except Exception as e:
        print(f"Ingest Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/chat")
@limiter.limit("5/minute")
async def chat_with_langgraph(request: Request, payload: dict = Body(...)):
    """
    Main Chat Endpoint: Isolates history by User + Document.
    """
    try:
        user_message = payload.get("message")
        doc_id = str(payload.get("doc_id"))
        workspace_id = str(payload.get("workspace_id"))
        
        # 1. CAPTURE THE USER ID
        # The frontend must send this (e.g., from the logged-in user state)
        user_id = str(payload.get("user_id")) 

        # 2. CREATE THE UNIQUE SESSION ID
        # This ensures Abhinav and Rasil have separate history in DynamoDB
        session_id = f"{user_id}_{doc_id}"

        state = {
            "message": user_message,
            "workspace_id": workspace_id,
            "doc_id": doc_id,
            "session_id": session_id, 
        }

        # Run the RAG logic (LangGraph)
        response = await run_rag(state)

        # 3. SAVE using the unique session_id
        # This prevents 'Double Saving' to the shared doc_id
        save_message(session_id, "user", user_message)
        save_message(session_id, "ai", response)

        return {"response": response}
    except Exception as e:
        print(f"LangGraph Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/history/{doc_id}")
@limiter.limit("20/minute")
async def fetch_chat_history(request: Request, doc_id: str):
    """
    Fetch history for a specific user on a specific document.
    Usage: /history/20?user_id=abhinav
    """
    try:
        # Get user_id from the query parameters
        user_id = request.query_params.get("user_id")
        
        if not user_id:
            raise HTTPException(status_code=400, detail="user_id query parameter is required")
            
        session_id = f"{user_id}_{doc_id}"
        
        history = get_history(session_id)
        return {"history": history}
    except Exception as e:
        print(f"History Fetch Error: {e}")
        raise HTTPException(status_code=500, detail="Could not retrieve history")