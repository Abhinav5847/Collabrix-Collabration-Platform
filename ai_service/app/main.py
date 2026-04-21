from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware  # 1. Import Middleware
from app.api.chat import router
from app.vector.qdrant import init_collection

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Handles startup and shutdown logic.
    Everything before 'yield' runs when the server starts.
    """
    print("🚀 Starting AI Service...")
    
    try:
        # Initialize Qdrant collection (Creates it if it doesn't exist)
        init_collection()
        print("Qdrant collection initialized.")
    except Exception as e:
        print(f"⚠️ Warning: Could not initialize Qdrant on startup: {e}")
    
    yield  # --- The FastAPI application is now running and handling requests ---
    
    print("Stopping AI Service...")

# Initialize the FastAPI app with the lifespan manager
app = FastAPI(
    title="Collabrix AI Service",
    description="Backend service for RAG-based document chat",
    lifespan=lifespan
)

# 2. Add CORS Middleware BEFORE including routers
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows your React app to talk to this service
    allow_credentials=True,
    allow_methods=["*"],  # Allows GET, POST, OPTIONS, etc.
    allow_headers=["*"],  # Allows all headers (Content-Type, etc.)
)

# Include your chat router
app.include_router(router, prefix="/ai")

@app.get("/health")
def health():
    """
    Simple health check to verify the container is running.
    """
    return {"status": "ok", "service": "AI Service"}