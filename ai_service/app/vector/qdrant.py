import uuid
from qdrant_client import QdrantClient
from qdrant_client.http.models import Filter, FieldCondition, MatchValue, PointStruct, VectorParams, Distance
from app.ai.embeddings import embed_query
from langchain_qdrant import QdrantVectorStore as LCQdrant
from langchain_core.embeddings import Embeddings

client = QdrantClient(host="qdrant", port=6333)
COLLECTION = "collabrix_v1_768"

def init_collection():
    try:
        collections = client.get_collections().collections
        exists = any(c.name == COLLECTION for c in collections)
        
        if not exists:
            client.create_collection(
                collection_name=COLLECTION,
                vectors_config=VectorParams(size=768, distance=Distance.COSINE),
            )
            print(f"Qdrant Collection '{COLLECTION}' created.")
        else:
            print(f"ℹQdrant Collection '{COLLECTION}' already exists.")
    except Exception as e:
        print(f"Qdrant Init Error: {e}")

def upsert_document(text: str, workspace_id: str, doc_id: str):

    if not text: return
    vector = embed_query(text)
    
    point_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, str(doc_id)))

    client.upsert(
        collection_name=COLLECTION,
        points=[PointStruct(
            id=point_id,
            vector=vector,
            payload={
                "page_content": text,
                "workspace_id": str(workspace_id),
                "doc_id": str(doc_id),
            },
        )]
    )

class CustomEmbedding(Embeddings):
    def embed_query(self, text): return embed_query(text)
    def embed_documents(self, texts): return [embed_query(t) for t in texts]

def get_retriever(workspace_id: str, doc_id: str):
    vectorstore = LCQdrant(
        client=client,
        collection_name=COLLECTION,
        embedding=CustomEmbedding(),
        content_payload_key="page_content"
    )
    return vectorstore.as_retriever(
        search_kwargs={
            "k": 3,
            "filter": Filter(
                must=[
                    FieldCondition(key="workspace_id", match=MatchValue(value=str(workspace_id))),
                    FieldCondition(key="doc_id", match=MatchValue(value=str(doc_id))),
                ]
            ),
        }
    )