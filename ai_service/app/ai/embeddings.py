from google import genai
from app.core.config import settings

client = genai.Client(api_key=settings.GEMINI_API_KEY)

MODEL = "gemini-embedding-001"

def embed_query(text: str):
    res = client.models.embed_content(
        model=MODEL,
        contents=text,
        config={
            'task_type': 'RETRIEVAL_QUERY',
            'output_dimensionality': 768  
        }
    )
    return res.embeddings[0].values

def embed_docs(texts: list[str]):
    res = client.models.embed_content(
        model=MODEL,
        contents=texts,
        config={
            'task_type': 'RETRIEVAL_DOCUMENT',
            'output_dimensionality': 768 
        }
    )
    return [e.values for e in res.embeddings]