import uuid
from qdrant_client import QdrantClient
from qdrant_client.http.models import Filter, FieldCondition, MatchValue, VectorParams, Distance, PointStruct
from app.core.config import settings
from app.ai.embeddings import embed_query 

client = QdrantClient(host=settings.QDRANT_HOST, port=settings.QDRANT_PORT)
COLLECTION = "collabrix_v1_768" 

def init_collection():

    try:
        collections = client.get_collections().collections
        if not any(c.name == COLLECTION for c in collections):
            print(f"🚀 Creating Qdrant {COLLECTION}")
            client.create_collection(
                collection_name=COLLECTION,
                vectors_config=VectorParams(size=768, distance=Distance.COSINE),
            )
    except Exception as e:
        print(f"⚠️ Qdrant Init Warning: {e}")

def upsert_document(text: str, workspace_id: str, doc_id: str):

    if not text:
        return
        
    vector = embed_query(text)
    
    point_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, str(doc_id)))
    
    point = PointStruct(
        id=point_id,
        vector=vector,
        payload={
            "text": text, 
            "workspace_id": str(workspace_id), 
            "doc_id": str(doc_id)
        }
    )
    client.upsert(collection_name=COLLECTION, points=[point])

def search(query_text: str, workspace_id: str, doc_id: str):

    query_vector = embed_query(query_text)
    
    qdrant_filter = Filter(must=[
        FieldCondition(key="workspace_id", match=MatchValue(value=str(workspace_id))),
        FieldCondition(key="doc_id", match=MatchValue(value=str(doc_id)))
    ])
    
    try:
        response = client.query_points(
            collection_name=COLLECTION,
            query=query_vector,
            query_filter=qdrant_filter,
            limit=5
        )
        results = response.points
    except Exception:
    
        results = client.search(
            collection_name=COLLECTION,
            query_vector=query_vector,
            query_filter=qdrant_filter,
            limit=5
        )
    
    return [hit.payload.get("text", "") for hit in results if hit.payload]