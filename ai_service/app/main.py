from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

# RAG & Core Imports
from app.api.chat import router as rag_router
from app.vector.qdrant import init_collection
from app.core.limiter import limiter
from app.api.meetings import router as meeting_router

# Agent Imports
from app.api.agent_chat import router as agent_router

from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler
from slowapi.middleware import SlowAPIMiddleware

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 Starting Collabrix AI Service...")
    
    # 1. RAG: Initialize Qdrant
    try:
        init_collection()
        print("Qdrant initialized.")
    except Exception as e:
        print(f"Qdrant failed: {e}")

    # 2. DynamoDB Setup
    try:
        from app.services.memory import dynamodb
        client = dynamodb.meta.client
        
        try:
            dynamodb.create_table(
                TableName='Collabrix_AiChat_History',
                KeySchema=[
                    {'AttributeName': 'doc_id', 'KeyType': 'HASH'},
                    {'AttributeName': 'timestamp', 'KeyType': 'RANGE'}
                ],
                AttributeDefinitions=[
                    {'AttributeName': 'doc_id', 'AttributeType': 'S'},
                    {'AttributeName': 'timestamp', 'AttributeType': 'N'}
                ],
                ProvisionedThroughput={'ReadCapacityUnits': 5, 'WriteCapacityUnits': 5}
            )
            print("RAG Table verified.")
        except client.exceptions.ResourceInUseException:
            pass
            
        print("Note: Agent Table is managed manually in AWS Console.")

    except Exception as e:
        print(f"DynamoDB Setup Error: {e}")
    
    yield 
    print("Stopping Service...")

app = FastAPI(title="Collabrix AI Service", lifespan=lifespan)

# Restore Rate Limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# FIXED: CORS for HttpOnly Cookies
# When allow_credentials=True, allow_origins CANNOT be ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000","http://127.0.0.1:4000","http://localhost:4000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- ROUTES ---
app.include_router(rag_router, prefix="", tags=["RAG"])
app.include_router(agent_router, prefix="/agent", tags=["Agent"])
app.include_router(meeting_router, prefix="/meetings", tags=["Meetings"])

@app.get("/health")
def health():
    return {"status": "ok"}