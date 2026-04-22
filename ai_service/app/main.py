from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.chat import router
from app.vector.qdrant import init_collection
import os

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 Starting AI Service...")
    
    # 1. Initialize Qdrant
    try:
        init_collection()
        print("Qdrant collection initialized.")
    except Exception as e:
        print(f"⚠️ Warning: Qdrant init failed: {e}")

    # 2. Initialize DynamoDB Table
    # IMPORT INSIDE THE FUNCTION to avoid circular dependency errors
    try:
        from app.services.memory import dynamodb
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
        print("✅ DynamoDB table 'Collabrix_AiChat_History' created.")
    except Exception:
        # If it already exists, this will fail silently, which is normal
        print("ℹ️ DynamoDB table check complete (Already exists or Cloud).")
    
    yield 
    
    print("Stopping AI Service...")

# CRITICAL: Ensure 'app' is defined at the top level and not inside any 'if' block
app = FastAPI(
    title="Collabrix AI Service",
    description="Backend service for RAG-based document chat",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/ai")

@app.get("/health")
def health():
    return {"status": "ok", "service": "AI Service"}