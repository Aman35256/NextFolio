import os
import re
import logging
import math
from typing import List, Dict, Any
from app.config import settings
from app.qdrant_client import qdrant_client, create_collection_if_not_exists

logger = logging.getLogger("nextfolio.rag")

COLLECTION_NAME = "nextfolio_knowledge"
EMBEDDING_DIM = 384  # Dimension of all-MiniLM-L6-v2

# Lazy loading of local embedding model
_embedding_model = None

def get_embedding_model():
    global _embedding_model
    if _embedding_model is None:
        from sentence_transformers import SentenceTransformer
        logger.info(f"Loading local embedding model: {settings.EMBEDDING_MODEL}")
        device = "cuda" if torch_is_cuda_available() else "cpu"
        _embedding_model = SentenceTransformer(settings.EMBEDDING_MODEL, device=device)
    return _embedding_model

def torch_is_cuda_available() -> bool:
    try:
        import torch
        return torch.cuda.is_available()
    except Exception:
        return False

# --- TF-IDF Fallback Engine ---

class TFIDFFallback:
    def __init__(self):
        self.documents = []
        self.vocab = set()
        self.df = {}
        self.idf = {}
        self.doc_vectors = []
        self.load_local_docs()
        self.build_tfidf()

    def load_local_docs(self):
        kb_dir = settings.KNOWLEDGE_BASE_DIR
        if not os.path.exists(kb_dir):
            logger.warning(f"Knowledge base directory does not exist: {kb_dir}")
            return
        for filename in os.listdir(kb_dir):
            if filename.endswith('.md'):
                filepath = os.path.join(kb_dir, filename)
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        content = f.read()
                    paragraphs = re.split(r'\n(?:#+|\s*\n)', content)
                    for idx, para in enumerate(paragraphs):
                        para_cleaned = para.strip()
                        if not para_cleaned or len(para_cleaned) < 30:
                            continue
                        self.documents.append({
                            "id": f"{filename}#P{idx}",
                            "source": filename,
                            "content": para_cleaned,
                            "tokens": self.tokenize(para_cleaned)
                        })
                except Exception as e:
                    logger.error(f"Failed to load RAG doc {filename}: {e}")

    def tokenize(self, text: str) -> List[str]:
        words = re.findall(r'\b[a-z0-9]+\b', text.lower())
        return [w for w in words if len(w) > 2]

    def build_tfidf(self):
        N = len(self.documents)
        if N == 0:
            return
        for doc in self.documents:
            for t in set(doc["tokens"]):
                self.df[t] = self.df.get(t, 0) + 1
                self.vocab.add(t)
        for t, freq in self.df.items():
            self.idf[t] = math.log((1 + N) / (1 + freq)) + 1
        for doc in self.documents:
            vector = {}
            tokens = doc["tokens"]
            for t in tokens:
                vector[t] = (tokens.count(t) / len(tokens)) * self.idf[t]
            self.doc_vectors.append(vector)

    def query(self, search_query: str, top_k: int = 3) -> List[Dict[str, Any]]:
        query_tokens = self.tokenize(search_query)
        if not query_tokens or not self.documents:
            return []
        query_vector = {}
        for t in query_tokens:
            if t in self.vocab:
                query_vector[t] = (query_tokens.count(t) / len(query_tokens)) * self.idf[t]
        
        query_norm = math.sqrt(sum(val ** 2 for val in query_vector.values()))
        if query_norm == 0:
            return self.documents[:top_k]

        scores = []
        for idx, doc_vector in enumerate(self.doc_vectors):
            dot_product = sum(val * doc_vector.get(t, 0) for t, val in query_vector.items())
            doc_norm = math.sqrt(sum(val ** 2 for val in doc_vector.values()))
            similarity = dot_product / (query_norm * doc_norm) if doc_norm > 0 else 0
            scores.append((similarity, self.documents[idx]))

        scores.sort(key=lambda x: x[0], reverse=True)
        return [{
            "id": doc["id"],
            "source": doc["source"],
            "content": doc["content"],
            "score": round(sim, 4)
        } for sim, doc in scores[:top_k]]

# Initialize Fallback Engine
_fallback_engine = None

def get_fallback_engine():
    global _fallback_engine
    if _fallback_engine is None:
        _fallback_engine = TFIDFFallback()
    return _fallback_engine

# --- RAG Pipeline Public API ---

def initialize_rag():
    """Initializes the Qdrant collection and ingests the local knowledge base."""
    try:
        create_collection_if_not_exists(COLLECTION_NAME, EMBEDDING_DIM)
        
        # Check if collection is empty
        collections_info = qdrant_client.get_collection(COLLECTION_NAME)
        if collections_info.points_count and collections_info.points_count > 0:
            logger.info("Qdrant collection already contains vector data.")
            return

        # Ingest documents
        logger.info("Ingesting local knowledge base into Qdrant...")
        model = get_embedding_model()
        fallback = get_fallback_engine()
        
        points = []
        from qdrant_client.http.models import PointStruct
        
        for idx, doc in enumerate(fallback.documents):
            vector = model.encode(doc["content"]).tolist()
            points.append(PointStruct(
                id=idx,
                vector=vector,
                payload={
                    "doc_id": doc["id"],
                    "source": doc["source"],
                    "content": doc["content"]
                }
            ))
            
        if points:
            qdrant_client.upsert(collection_name=COLLECTION_NAME, points=points)
            logger.info(f"Ingested {len(points)} paragraphs into Qdrant.")
    except Exception as e:
        logger.error(f"Failed to initialize Qdrant RAG: {e}. Falling back to local TF-IDF.")

def query_knowledge_base(search_query: str, top_k: int = 3) -> List[Dict[str, Any]]:
    """Queries the knowledge base, using Qdrant vector search or falling back to TF-IDF."""
    try:
        # Check if Qdrant is active and has the collection
        collections = [c.name for c in qdrant_client.get_collections().collections]
        if COLLECTION_NAME in collections:
            model = get_embedding_model()
            query_vector = model.encode(search_query).tolist()
            
            search_result = qdrant_client.search(
                collection_name=COLLECTION_NAME,
                query_vector=query_vector,
                limit=top_k
            )
            
            if search_result:
                return [{
                    "id": hit.payload["doc_id"],
                    "source": hit.payload["source"],
                    "content": hit.payload["content"],
                    "score": round(hit.score, 4)
                } for hit in search_result]
    except Exception as e:
        logger.warning(f"Qdrant query failed: {e}. Falling back to TF-IDF.")
        
    # Fallback to local TF-IDF search
    return get_fallback_engine().query(search_query, top_k)
