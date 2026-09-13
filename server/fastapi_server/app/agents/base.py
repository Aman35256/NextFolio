import time
import logging
import hashlib
import json
from typing import Dict, Any, List
from app.model_router import model_router
from app.rag import query_knowledge_base
from app.redis_client import cache_get_json, cache_set_json

logger = logging.getLogger("nextfolio.agents")

class BaseAgent:
    def __init__(self, name: str, complexity: str = "medium"):
        self.name = name
        self.complexity = complexity

    def _generate_cache_key(self, payload: Dict[str, Any]) -> str:
        """Generates a unique cache key based on the agent name and a hash of the input payload."""
        # Filter out transient/retry keys to ensure cache hits on identical inputs
        filtered = {k: v for k, v in payload.items() if not k.startswith("__")}
        serialized = json.dumps(filtered, sort_keys=True)
        payload_hash = hashlib.md5(serialized.encode()).hexdigest()
        return f"agent_cache:{self.name}:{payload_hash}"

    def plan(self, payload: Dict[str, Any]) -> str:
        """Outlines the execution steps and dependencies of the agent task."""
        return f"Formulating execution steps for {self.name} on input keys: {list(payload.keys())}"

    def reason(self, payload: Dict[str, Any]) -> str:
        """Performs chain-of-thought or context analysis before execution."""
        return f"Analyzing context and preparing prompts for {self.name}."

    def validate(self, output: Dict[str, Any]) -> bool:
        """Applies validation checks on the generated output structure. Returns True if valid."""
        # By default, check that we didn't get an empty dictionary
        return bool(output)

    def retry(self, payload: Dict[str, Any], error_msg: str) -> Dict[str, Any]:
        """Performs a retry with modified parameters (e.g. increased temperature or feedback)."""
        logger.warning(f"[{self.name}] Validation failed: {error_msg}. Retrying execution...")
        # Override in subclasses if custom retry logic is needed
        # We can pass an extra feedback prompt to the LLM to correct itself
        payload["__retry_feedback__"] = f"Your previous output failed validation: {error_msg}. Please correct it."
        return self.execute_task(payload)

    def run(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Main execution wrapper that orchestrates caching, planning, reasoning, execution, validation, and retries."""
        # 1. Check Cache first
        cache_key = self._generate_cache_key(payload)
        try:
            cached_res = cache_get_json(cache_key)
            if cached_res:
                logger.info(f"[{self.name}] Cache hit! Returning cached result.")
                return cached_res
        except Exception as cache_err:
            logger.warning(f"[{self.name}] Cache read error: {cache_err}")

        start_time = time.time()
        planning = self.plan(payload)
        reasoning = self.reason(payload)
        
        try:
            output = self.execute_task(payload)
            
            # Validation step
            max_retries = 2
            retry_count = 0
            is_valid = self.validate(output)
            
            while not is_valid and retry_count < max_retries:
                retry_count += 1
                logger.info(f"[{self.name}] Retry attempt {retry_count}/{max_retries}...")
                output = self.retry(payload, "Output structure did not match expected schema or was empty.")
                is_valid = self.validate(output)
            
            execution_time = int((time.time() - start_time) * 1000)
            confidence = self.report_confidence(output) if is_valid else 0
            
            result_log = {
                "agentName": self.name,
                "status": "completed" if is_valid else "failed",
                "progress": 100,
                "planning": planning,
                "reasoning": reasoning,
                "validation": "Passed" if is_valid else "Failed Validation",
                "confidence": confidence,
                "executionTime": execution_time,
                "output": output
            }

            # 2. Store in Cache if valid
            if is_valid:
                try:
                    # Cache for 24 hours
                    cache_set_json(cache_key, result_log, expire_seconds=86400)
                except Exception as cache_err:
                    logger.warning(f"[{self.name}] Cache write error: {cache_err}")

            return result_log
            
        except Exception as e:
            execution_time = int((time.time() - start_time) * 1000)
            logger.error(f"Error executing agent {self.name}: {e}")
            return {
                "agentName": self.name,
                "status": "failed",
                "progress": 100,
                "planning": planning,
                "reasoning": reasoning,
                "validation": "Error",
                "confidence": 0,
                "executionTime": execution_time,
                "error": str(e),
                "output": None
            }

    def execute_task(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Core task execution logic. Must be overridden by subclasses."""
        raise NotImplementedError("Subclasses must implement execute_task")

    def report_confidence(self, output: Dict[str, Any]) -> int:
        """Computes a self-assessed confidence score (0-100) based on output quality."""
        if not output:
            return 0
        return 95  # Default high confidence for successful execution

    def query_rag(self, query: str, top_k: int = 2) -> str:
        """Convenience method to query the local RAG system."""
        try:
            docs = query_knowledge_base(query, top_k)
            return "\n\n".join([f"[Source: {d['source']}]\n{d['content']}" for d in docs])
        except Exception as e:
            logger.error(f"RAG query failed inside agent {self.name}: {e}")
            return ""
