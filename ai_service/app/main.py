from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

from app.api.chat import router as rag_router
from app.api.agent_chat import router as agent_router
from app.vector.qdrant import init_collection
from app.core.limiter import limiter
from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler
from slowapi.middleware import SlowAPIMiddleware

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 Starting Collabrix AI Service...")
    
    # 1. Initialize Vector DB (Qdrant)
    try:
        init_collection()
        print("✅ Qdrant collection initialized.")
    except Exception as e:
        print(f"⚠️ Qdrant init failed: {e}")

    # 2. Initialize DynamoDB Tables
    try:
        from app.services.memory import dynamodb
        # Access the low-level client from the resource to get exceptions
        client = dynamodb.meta.client
        
        # --- Table A: RAG Chat History ---
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
            print("📦 Table 'Collabrix_AiChat_History' created.")
        except client.exceptions.ResourceInUseException:
            print("ℹ️ Table 'Collabrix_AiChat_History' already exists.")

        # --- Table B: Agent Checkpoints ---
        # REQUIRED: thread_id (HASH) and checkpoint_id (RANGE) for LangGraph
        try:
            dynamodb.create_table(
                TableName='Collabrix_Agent_Checkpoints',
                KeySchema=[
                    {'AttributeName': 'thread_id', 'KeyType': 'HASH'},
                    {'AttributeName': 'checkpoint_id', 'KeyType': 'RANGE'}
                ],
                AttributeDefinitions=[
                    {'AttributeName': 'thread_id', 'AttributeType': 'S'},
                    {'AttributeName': 'checkpoint_id', 'AttributeType': 'S'}
                ],
                ProvisionedThroughput={'ReadCapacityUnits': 5, 'WriteCapacityUnits': 5}
            )
            print("📦 Table 'Collabrix_Agent_Checkpoints' created.")
        except client.exceptions.ResourceInUseException:
            print("ℹ️ Table 'Collabrix_Agent_Checkpoints' already exists.")

    except Exception as e:
        print(f"❌ DynamoDB initialization error: {e}")
    
    yield 
    print("🛑 Stopping AI Service...")

app = FastAPI(
    title="Collabrix AI Service",
    description="Multi-Agent and RAG Service",
    lifespan=lifespan
)

# RATE LIMITING
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# ROUTING
# Note: Ensure these prefixes match your Nginx configuration
app.include_router(rag_router, prefix="/chat", tags=["RAG Chat"])
app.include_router(agent_router, prefix="/agent", tags=["Agentic AI"])

@app.get("/health")
def health():
    return {"status": "ok", "service": "AI Service"}