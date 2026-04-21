from fastapi import APIRouter
from app.schemas.chat import ChatRequest
from app.ai.rag import run_rag

router = APIRouter()


@router.post("/chat")
async def chat(req: ChatRequest):

    state = {
        "message": req.message,
        "workspace_id": req.workspace_id,
        "doc_id": req.doc_id,
        "history": req.history or []
    }

    response = await run_rag(state)

    return {"response": response}