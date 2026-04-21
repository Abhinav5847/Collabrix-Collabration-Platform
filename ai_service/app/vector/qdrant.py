from qdrant_client import QdrantClient
from qdrant_client.http.models import Filter, FieldCondition, MatchValue, VectorParams, Distance
from app.core.config import settings
from app.ai.embeddings import embed_query 

# Initialize the client
client = QdrantClient(
    host=settings.QDRANT_HOST,
    port=settings.QDRANT_PORT
)

COLLECTION = "collabrix_v1_768" 

def init_collection():
    """
    Checks if the collection exists. If not, creates it.
    This prevents accidental data deletion on server restarts.
    """
    # 1. Check existing collections
    collections = client.get_collections().collections
    exists = any(c.name == COLLECTION for c in collections)
    
    if not exists:
        print(f"Creating new Qdrant collection: {COLLECTION}")
        client.create_collection(
            collection_name=COLLECTION,
            vectors_config=VectorParams(size=768, distance=Distance.COSINE),
        )
    else:
        print(f"Qdrant collection '{COLLECTION}' already exists. Skipping init.")

def search(query_text: str, workspace_id: str, doc_id: str):
    """
    Searches for context restricted to a specific document within a workspace.
    """
    query_vector = embed_query(query_text)

    qdrant_filter = Filter(
        must=[
            FieldCondition(
                key="workspace_id",
                match=MatchValue(value=str(workspace_id))
            ),
            FieldCondition(
                key="doc_id",
                match=MatchValue(value=str(doc_id))
            )
        ]
    )

    try:
        # Standard search for sync QdrantClient
        results = client.search(
            collection_name=COLLECTION,
            query_vector=query_vector,
            query_filter=qdrant_filter,
            limit=5
        )
    except Exception as e:
        # Fallback for Qdrant Client v1.11+ / 2026 API standards
        print(f"Switching to query_points due to: {e}")
        response = client.query_points(
            collection_name=COLLECTION,
            query=query_vector,
            query_filter=qdrant_filter,
            limit=5
        )
        results = response.points

    # Return only the text chunks
    return [hit.payload.get("text", "") for hit in results if hit.payload]