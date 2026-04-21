from fastapi import APIRouter, Body, HTTPException
from app.vector.qdrant import upsert_document
from app.ai.rag import run_rag # This is your LangGraph logic
import os

router = APIRouter()

# --- 1. INGEST ENDPOINT (For Celery) ---
@router.post("/ingest")
async def ingest_from_celery(payload: dict = Body(...)):
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

# --- 2. CHAT ENDPOINT (For React - Using LangGraph) ---
@router.post("/chat")
async def chat_with_langgraph(payload: dict = Body(...)):
    try:
        # Prepare the state for your LangGraph 'run_rag' function
        state = {
            "message": payload.get("message"),
            "workspace_id": str(payload.get("workspace_id")),
            "doc_id": str(payload.get("doc_id")),
            "history": payload.get("history", [])
        }

        # This calls your LangGraph workflow
        response = await run_rag(state)

        return {"response": response}
    except Exception as e:
        print(f"LangGraph Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))