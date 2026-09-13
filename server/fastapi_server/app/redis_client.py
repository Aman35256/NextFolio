import json
import logging
import redis
from typing import Any, Optional
from app.config import settings

logger = logging.getLogger("nextfolio.redis")

class InMemoryCache:
    """Thread-safe in-memory fallback cache if Redis is unavailable."""
    def __init__(self):
        self._data = {}
        logger.warning("Initializing InMemoryCache fallback.")

    def get(self, key: str) -> Optional[str]:
        return self._data.get(key)

    def set(self, key: str, value: str, ex: Optional[int] = None) -> bool:
        self._data[key] = value
        return True

    def delete(self, key: str) -> bool:
        if key in self._data:
            del self._data[key]
            return True
        return False

    def ping(self) -> bool:
        return True

# Initialize client
redis_client = None
try:
    redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True, socket_timeout=2.0)
    # Test connection
    redis_client.ping()
    logger.info("Successfully connected to Redis.")
except Exception as redis_err:
    logger.warning(f"Redis connection failed ({redis_err}). Falling back to in-memory cache.")
    redis_client = InMemoryCache()

def cache_get_json(key: str) -> Optional[Any]:
    """Retrieve a JSON-deserialized object from cache."""
    try:
        data = redis_client.get(key)
        if data:
            return json.loads(data)
    except Exception as e:
        logger.error(f"Failed to get key {key} from cache: {e}")
    return None

def cache_set_json(key: str, value: Any, expire_seconds: int = 3600) -> bool:
    """Store a JSON-serialized object in cache with an expiration time."""
    try:
        redis_client.set(key, json.dumps(value), ex=expire_seconds)
        return True
    except Exception as e:
        logger.error(f"Failed to set key {key} in cache: {e}")
    return False

def cache_delete(key: str) -> bool:
    """Remove a key from cache."""
    try:
        redis_client.delete(key)
        return True
    except Exception as e:
        logger.error(f"Failed to delete key {key} from cache: {e}")
    return False
