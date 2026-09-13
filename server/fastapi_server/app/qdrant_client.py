import logging
from qdrant_client import QdrantClient
from app.config import settings

logger = logging.getLogger("nextfolio.qdrant")

qdrant_client = None

try:
    if settings.QDRANT_IN_MEMORY:
        logger.info("Initializing Qdrant in-memory client.")
        qdrant_client = QdrantClient(":memory:")
    else:
        logger.info(f"Connecting to Qdrant at {settings.QDRANT_HOST}:{settings.QDRANT_PORT}")
        qdrant_client = QdrantClient(
            host=settings.QDRANT_HOST,
            port=settings.QDRANT_PORT,
            api_key=settings.QDRANT_API_KEY,
            timeout=5.0
        )
        # Test connection
        qdrant_client.get_collections()
        logger.info("Successfully connected to Qdrant.")
except Exception as qdrant_err:
    logger.warning(f"Qdrant connection failed ({qdrant_err}). Falling back to in-memory Qdrant client.")
    qdrant_client = QdrantClient(":memory:")

def create_collection_if_not_exists(collection_name: str, vector_size: int):
    """Ensures a collection exists with the specified vector dimension and cosine distance metric."""
    from qdrant_client.http.models import Distance, VectorParams
    try:
        collections = [c.name for c in qdrant_client.get_collections().collections]
        if collection_name not in collections:
            qdrant_client.create_collection(
                collection_name=collection_name,
                vectors_config=VectorParams(size=vector_size, distance=Distance.COSINE),
            )
            logger.info(f"Created Qdrant collection: {collection_name}")
    except Exception as e:
        logger.error(f"Failed to create Qdrant collection {collection_name}: {e}")
        # In-memory client will handle this gracefully
