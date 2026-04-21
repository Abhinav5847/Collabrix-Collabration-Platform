from pydantic import BaseModel
from typing import List, Dict, Any

class ChatRequest(BaseModel):
    message: str
    workspace_id: str
    doc_id: str # Required: The specific "room" for this document's AI
    history: List[Dict[str, Any]] = []