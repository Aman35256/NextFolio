import os
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # Application Config
    APP_NAME: str = "NextFolio AI Platform"
    ENV: str = "development"
    DEBUG: bool = True
    PORT: int = 8000
    HOST: str = "0.0.0.0"
    SECRET_KEY: str = "super_secure_secret_key_nextfolio_123!"
    
    # Database
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/nextfolio"
    SQLITE_FALLBACK_URL: str = "sqlite:///./sqlite_fallback.db"
    
    # Redis & Celery
    REDIS_URL: str = "redis://localhost:6379/0"
    CELERY_BROKER_URL: str = "redis://localhost:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/2"
    
    # Vector Database
    QDRANT_HOST: str = "localhost"
    QDRANT_PORT: int = 6333
    QDRANT_API_KEY: Optional[str] = None
    QDRANT_IN_MEMORY: bool = False  # Set to True for unit tests/local fallback
    
    # Local LLM Routing / vLLM / Ollama
    OLLAMA_URL: str = "http://localhost:11434"
    VLLM_URL: Optional[str] = None  # If set, vLLM will be preferred over Ollama
    
    # Model Mappings (Local weights/repos or Ollama tags)
    MODEL_SMALL: str = "phi4:mini"          # Extraction, quick checks
    MODEL_MEDIUM: str = "qwen2.5:7b"        # ATS, LinkedIn, standard agents
    MODEL_LARGE: str = "llama3.3"           # Deep reasoning, career roadmap
    MODEL_CODING: str = "qwen2.5-coder:7b"  # Portfolio HTML/React generation
    
    # Embedding Model (Local PyTorch SentenceTransformers)
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"
    
    # RAG Config
    KNOWLEDGE_BASE_DIR: str = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "knowledge_base"))
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()
