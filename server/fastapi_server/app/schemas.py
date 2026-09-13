from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional

class OrchestratorRequest(BaseModel):
    userId: int
    query: str
    resumeData: Optional[Any] = None
    jobDescription: Optional[str] = ""
    settings: Optional[Dict[str, Any]] = {}
    profile: Optional[Dict[str, Any]] = None
    orchestrationId: Optional[str] = None

class OrchestratorResponse(BaseModel):
    success: bool
    orchestrationId: str
    reasoning: str
    pipeline: List[Dict[str, Any]]
    context: Dict[str, Any]
    error: Optional[str] = None

class AgentExecutionLog(BaseModel):
    agentName: str
    status: str  # pending, running, completed, failed, retrying
    progress: int
    planning: Optional[str] = None
    reasoning: Optional[str] = None
    validation: Optional[str] = None
    confidence: int = 100
    executionTime: int = 0
    error: Optional[str] = None
    input: Optional[Dict[str, Any]] = None
    output: Optional[Dict[str, Any]] = None

class AgentMessage(BaseModel):
    task: str
    objective: str
    input: Dict[str, Any]
    context: Dict[str, Any]
    dependencies: List[str]
    reasoning_summary: Optional[str] = None
    confidence: int = 100
    output: Optional[Dict[str, Any]] = None
    validation: Optional[str] = None
    execution_time: int = 0
    next_agent: Optional[str] = None

class RAGQueryRequest(BaseModel):
    query: str
    top_k: int = 3

class RAGQueryResponse(BaseModel):
    id: str
    source: str
    content: str
    score: float

class RAGIngestRequest(BaseModel):
    document_id: str
    source: str
    content: str
