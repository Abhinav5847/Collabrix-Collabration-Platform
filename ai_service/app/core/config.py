import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    
    QDRANT_HOST = os.getenv("QDRANT_HOST", "qdrant")
    QDRANT_PORT = int(os.getenv("QDRANT_PORT", 6333))
    GROQ_API_KEY = os.environ.get('GROQ_API_KEY')
    GEMINI_API_KEY=os.environ.get('GEMINI_API_KEY')


settings = Settings()