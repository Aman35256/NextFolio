import json
from typing import Dict, Any
from app.agents.base import BaseAgent
from app.model_router import model_router

class ContentValidationAgent(BaseAgent):
    def __init__(self):
        super().__init__("ContentValidationAgent", complexity="medium")

    def plan(self, payload: Dict[str, Any]) -> str:
        return "Reviewing generated content for grammar, tone consistency, accuracy, and removing potential hallucinations."

    def reason(self, payload: Dict[str, Any]) -> str:
        return "Comparing generated text against original inputs to ensure no false claims or details were added."

    def execute_task(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        text_to_validate = payload.get("text", "")
        original_context = payload.get("context", "")

        template = {
            "passed": True,
            "issues": [],
            "correctedText": "",
            "readabilityScore": 90,
            "hallucinationDetected": False
        }

        feedback = payload.get("__retry_feedback__", "")
        prompt = (
            f"Review this generated text and verify it against the original context.\n"
            f"Generated Text:\n{text_to_validate}\n\n"
            f"Original Context:\n{original_context}\n\n"
            f"{feedback}"
        )
        system = "You are a Content Validation Agent. Check for grammar, professional tone, and hallucinations, and output corrections."
        
        res = model_router.generate_structured(
            prompt=prompt,
            schema_template=template,
            system_prompt=system,
            temperature=0.1,
            complexity=self.complexity,
            task_name=self.name
        )
        
        # If passed is True, and correctedText is empty, default it to the input text
        if res.get("passed") and not res.get("correctedText"):
            res["correctedText"] = text_to_validate
            
        return res

    def validate(self, output: Dict[str, Any]) -> bool:
        if not output:
            return False
        return "passed" in output and "hallucinationDetected" in output
