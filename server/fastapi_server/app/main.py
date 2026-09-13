import json
import uuid
import logging
import asyncio
from fastapi import FastAPI, Depends, WebSocket, WebSocketDisconnect, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Dict, Any

# Import local modules
from app.config import settings
from app.database import get_db, DBAgentExecution
from app.schemas import OrchestratorRequest, OrchestratorResponse, RAGQueryRequest, RAGQueryResponse, RAGIngestRequest
from app.redis_client import redis_client
from app.rag import initialize_rag, query_knowledge_base, COLLECTION_NAME
from app.qdrant_client import qdrant_client
from app.celery_app import run_orchestration_task
from app.orchestrator import MasterOrchestrator
from app.monitoring import instrument_app, metrics_route

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("nextfolio.main")

app = FastAPI(
    title=settings.APP_NAME,
    description="High-performance local-first Multi-Agent AI Platform for NextFolio.",
    version="2.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Instrument app for Prometheus metrics and OpenTelemetry
instrument_app(app)
app.add_route("/metrics", metrics_route)

@app.on_event("startup")
async def startup_event():
    logger.info("Starting up NextFolio FastAPI server...")
    # Run RAG initialization in the background or synchronously
    initialize_rag()
    # Start the persistent background scheduler
    from app.scheduler import background_scheduler
    background_scheduler.start()

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Shutting down NextFolio FastAPI server...")
    from app.scheduler import background_scheduler
    background_scheduler.stop()

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "env": settings.ENV,
        "backends": {
            "redis": not isinstance(redis_client, type(None)),
            "qdrant": not isinstance(qdrant_client, type(None))
        }
    }

@app.post("/api/orchestrator/run")
def run_orchestrator(request: OrchestratorRequest):
    """Triggers the multi-agent orchestrator in the background via Celery."""
    orchestration_id = request.orchestrationId or str(uuid.uuid4())
    
    payload = request.dict()
    payload["orchestrationId"] = orchestration_id
    
    # Trigger Celery background task
    run_orchestration_task.delay(payload)
    
    return {
        "success": True,
        "orchestrationId": orchestration_id,
        "status": "triggered"
    }

# Instantiate MasterOrchestrator for individual agent routing
orchestrator_instance = MasterOrchestrator()

@app.post("/api/agents/{agent_action}")
async def run_individual_agent(agent_action: str, payload: Dict[str, Any]):
    """Generic endpoint to run any specific agent by action name, ensuring backward compatibility with the Node.js server."""
    mapping = {
        "resume.parse": orchestrator_instance.resume_parsing_agent,
        "ats.analyze": orchestrator_instance.ats_analysis_agent,
        "resume.improve": orchestrator_instance.resume_improvement_agent,
        "job.parse": orchestrator_instance.job_description_agent,
        "keyword.optimize": orchestrator_instance.keyword_optimization_agent,
        "portfolio.generate": orchestrator_instance.portfolio_generation_agent,
        "career.recommend": orchestrator_instance.career_recommendation_agent,
        "interview.prep": orchestrator_instance.interview_prep_agent,
        "skill.gap": orchestrator_instance.skill_gap_agent,
        "github.analyze": orchestrator_instance.github_analysis_agent,
        "linkedin.optimize": orchestrator_instance.linkedin_optimization_agent,
        "content.quality": orchestrator_instance.content_validation_agent,
        "pdf.generate": orchestrator_instance.pdf_generation_agent,
        "mentorship.chat": orchestrator_instance.ai_learning_tutor_agent,
        "email.understand": orchestrator_instance.email_understanding_agent,
    }
    
    # Handle legacy compatibility mappings
    if agent_action == "resume.analyze":
        from app.services.resume_analysis import resume_analyze
        res = resume_analyze(payload)
        return {"success": True, "result": res}
    elif agent_action == "job.match":
        res = orchestrator_instance.ats_analysis_agent.run(payload)
        return {"success": True, "result": res.get("output")}
    elif agent_action == "cover_letter.generate":
        res = orchestrator_instance.resume_improvement_agent.run(payload)
        return {"success": True, "result": res.get("output")}
        
    agent = mapping.get(agent_action)
    if not agent:
        raise HTTPException(status_code=404, detail=f"Agent action '{agent_action}' not found")
        
    res = agent.run(payload)
    if res["status"] == "failed":
        raise HTTPException(status_code=500, detail=res.get("error") or "Agent execution failed")
        
    return {"success": True, "result": res.get("output")}


@app.get("/api/orchestrator/status/{orchestration_id}")
def get_orchestration_status(orchestration_id: str, db: Session = Depends(get_db)):
    """Retrieves all agent execution logs for a specific orchestration ID."""
    logs = db.query(DBAgentExecution).filter_by(orchestrationId=orchestration_id).order_by(DBAgentExecution.createdAt.asc()).all()
    
    serialized_logs = []
    for log in logs:
        serialized_logs.append({
            "agentName": log.agentName,
            "status": log.status,
            "progress": log.progress,
            "planning": log.planning,
            "reasoning": log.reasoning,
            "validation": log.validation,
            "executionTime": log.executionTime,
            "error": log.error,
            "output": json.loads(log.output) if log.output else None,
            "createdAt": log.createdAt.isoformat() + "Z"
        })
        
    return {
        "success": True,
        "orchestrationId": orchestration_id,
        "logs": serialized_logs
    }

# --- WebSocket Progress Streaming ---

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

manager = ConnectionManager()

@app.websocket("/api/orchestrator/stream/{orchestration_id}")
async def websocket_stream(websocket: WebSocket, orchestration_id: str):
    """WebSocket endpoint that streams real-time agent execution logs via Redis Pub/Sub."""
    await manager.connect(websocket)
    
    # Connect to Redis Pub/Sub
    pubsub = None
    try:
        if hasattr(redis_client, 'pubsub'):
            pubsub = redis_client.pubsub()
            pubsub.subscribe(f"orchestration:{orchestration_id}")
            logger.info(f"WebSocket client subscribed to orchestration:{orchestration_id}")
            
            # Send initial message
            await websocket.send_json({"status": "connected", "orchestrationId": orchestration_id})
            
            while True:
                # Check for incoming messages (non-blocking sleep to yield control)
                message = pubsub.get_message(ignore_subscribe_messages=True, timeout=0.1)
                if message and message.get("type") == "message":
                    data = json.loads(message["data"])
                    await websocket.send_json(data)
                await asyncio.sleep(0.05)
        else:
            # Fallback if Redis is offline: poll database changes
            logger.warning("Redis Pub/Sub unavailable. Falling back to database polling for WebSocket stream.")
            last_count = 0
            while True:
                db = SessionLocal()
                try:
                    logs = db.query(DBAgentExecution).filter_by(orchestrationId=orchestration_id).all()
                    if len(logs) > last_count:
                        # Send updates
                        for log in logs[last_count:]:
                            await websocket.send_json({
                                "agentName": log.agentName,
                                "status": log.status,
                                "progress": log.progress,
                                "reasoning": log.reasoning,
                                "planning": log.planning,
                                "validation": log.validation,
                                "error": log.error
                            })
                        last_count = len(logs)
                finally:
                    db.close()
                await asyncio.sleep(1.0)
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        logger.info(f"WebSocket client disconnected from {orchestration_id}")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket)
    finally:
        if pubsub:
            pubsub.unsubscribe(f"orchestration:{orchestration_id}")

# --- RAG Management Endpoints ---

@app.post("/api/rag/query", response_model=List[RAGQueryResponse])
def query_rag(request: RAGQueryRequest):
    """Performs semantic search query on the local knowledge base."""
    return query_knowledge_base(request.query, request.top_k)

@app.post("/api/rag/ingest")
def ingest_rag(request: RAGIngestRequest):
    """Ingests a new document paragraph into the vector database."""
    from qdrant_client.http.models import PointStruct
    from app.rag import get_embedding_model
    try:
        model = get_embedding_model()
        vector = model.encode(request.content).tolist()
        
        # Use hash of document_id for integer id in Qdrant
        import hashlib
        doc_hash = int(hashlib.md5(request.document_id.encode()).hexdigest(), 16) % (10 ** 8)
        
        qdrant_client.upsert(
            collection_name=COLLECTION_NAME,
            points=[PointStruct(
                id=doc_hash,
                vector=vector,
                payload={
                    "doc_id": request.document_id,
                    "source": request.source,
                    "content": request.content
                }
            )]
        )
        return {"success": True, "message": f"Document {request.document_id} successfully ingested."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
