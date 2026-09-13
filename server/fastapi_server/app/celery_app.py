import logging
from celery import Celery
from app.config import settings

logger = logging.getLogger("nextfolio.celery")

celery_app = Celery(
    "nextfolio_tasks",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=1800,  # 30 minutes max execution
)

# Optional: Set task_always_eager = True if Redis is offline to run tasks synchronously in-process
try:
    import redis
    r = redis.from_url(settings.REDIS_URL, socket_timeout=1.0)
    r.ping()
except Exception:
    logger.warning("Redis is offline. Running Celery in EAGER mode (synchronous task execution).")
    celery_app.conf.update(task_always_eager=True)

@celery_app.task(name="run_orchestration_task")
def run_orchestration_task(payload: dict) -> dict:
    """Background task to execute the Master AI Orchestrator LangGraph pipeline."""
    # Import orchestrator inside the task to avoid circular imports
    from app.orchestrator import MasterOrchestrator
    import asyncio
    
    orchestrator = MasterOrchestrator()
    # Run the async pipeline in a new event loop
    loop = asyncio.get_event_loop()
    if loop.is_closed():
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
    return loop.run_until_complete(orchestrator.run_pipeline(payload))
