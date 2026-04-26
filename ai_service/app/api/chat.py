from fastapi import APIRouter, Body, HTTPException, Request
from app.vector.qdrant import upsert_document
from app.ai.rag import run_rag 
from app.services.memory import get_history, save_message 
from app.core.limiter import limiter  
import os

router = APIRouter()

@router.post("/ingest")
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

@router.post("")
@limiter.limit("5/minute")
async def chat_with_langgraph(request: Request, payload: dict = Body(...)):
    try:
        user_message = payload.get("message")
        doc_id = str(payload.get("doc_id"))
        workspace_id = str(payload.get("workspace_id"))

        state = {
            "message": user_message,
            "workspace_id": workspace_id,
            "doc_id": doc_id,
        }

        response = await run_rag(state)

        save_message(doc_id, "user", user_message)
        save_message(doc_id, "ai", response)

        return {"response": response}
    except Exception as e:
        print(f"LangGraph Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/history/{doc_id}")
@limiter.limit("20/minute")
async def fetch_chat_history(request: Request, doc_id: str):
    try:
        history = get_history(doc_id)
        return {"history": history}
    except Exception as e:
        print(f"History Fetch Error: {e}")
        raise HTTPException(status_code=500, detail="Could not retrieve history")