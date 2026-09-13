import time
import logging
from fastapi import Request, HTTPException, Security
from fastapi.security.api_key import APIKeyHeader
from starlette.status import HTTP_403_FORBIDDEN
from app.redis_client import redis_client
from app.config import settings

logger = logging.getLogger("nextfolio.security")

API_KEY_NAME = "X-API-Key"
api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=False)

async def validate_api_key(api_key: str = Security(api_key_header)):
    """Validates the incoming X-API-Key header against the configured system key."""
    # In development, allow bypass if key is not explicitly set
    if settings.ENV == "development" and not api_key:
        return True
        
    if api_key != settings.SECRET_KEY:
        raise HTTPException(
            status_code=HTTP_403_FORBIDDEN, detail="Could not validate credentials"
        )
    return True

async def rate_limiter(request: Request):
    """Asynchronous rate limiter using Redis token bucket or basic sliding window.
    Falls back gracefully if Redis is offline.
    """
    client_ip = request.client.host
    key = f"rate_limit:{client_ip}"
    
    try:
        if hasattr(redis_client, 'ping'):
            # Allow 100 requests per minute
            current = redis_client.get(key)
            if current and int(current) >= 100:
                raise HTTPException(status_code=429, detail="Too many requests. Please try again later.")
            
            pipe = redis_client.pipeline()
            pipe.incr(key)
            pipe.expire(key, 60)
            pipe.execute()
    except HTTPException:
        raise
    except Exception as e:
        logger.warning(f"Rate limiter failed: {e}. Allowing request through.")
