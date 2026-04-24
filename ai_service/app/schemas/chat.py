from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from app.vector.qdrant import upsert_document
from app.ai.rag import run_rag

router = APIRouter()

class ChatRequest(BaseModel):
    message: Optional[str] = None      
    text: Optional[str] = None         
    page_content: Optional[str] = None 
    workspace_id: str
    doc_id: str 
    history: List[Dict[str, Any]] = [] 



@router.post("/ingest")
async def ingest_data(request: ChatRequest):
 
    content = request.page_content or request.text
    
    if not content:
        raise HTTPException(status_code=400, detail="No document content provided.")

    try:
        upsert_document(
            text=content, 
            workspace_id=str(request.workspace_id), 
            doc_id=str(request.doc_id)
        )
        return {"status": "success", "doc_id": request.doc_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Qdrant Sync Error: {str(e)}")

@router.post("/chat")
async def chat_endpoint(request: ChatRequest):

    if not request.message:
        raise HTTPException(status_code=400, detail="Message is required for chat.")

    try:

        response_text = await run_rag({
            "message": request.message,
            "workspace_id": str(request.workspace_id),
            "doc_id": str(request.doc_id)
        })
        return {"response": response_text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Error: {str(e)}")

@router.get("/chat/history/{doc_id}")
async def get_chat_history(doc_id: str):

    from app.services.memory import get_history
    try:
        history = get_history(str(doc_id))
        return {"history": history}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))