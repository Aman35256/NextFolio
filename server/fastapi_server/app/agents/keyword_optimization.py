import json
from typing import Dict, Any
from app.agents.base import BaseAgent
from app.model_router import model_router

class KeywordOptimizationAgent(BaseAgent):
    def __init__(self):
        super().__init__("KeywordOptimizationAgent", complexity="medium")

    def plan(self, payload: Dict[str, Any]) -> str:
        return "Comparing candidate resume and job description to identify missing keywords and plan natural insertion locations."

    def reason(self, payload: Dict[str, Any]) -> str:
        return "Evaluating relevance of missing keywords to ensure they match candidate's actual experience without keyword stuffing."

    def execute_task(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        profile = payload.get("profile", {})
        job_profile = payload.get("jobProfile", {})

        template = {
            "missingKeywords": ["Docker", "Kubernetes", "GraphQL"],
            "matchingKeywords": ["React", "Python", "SQL"],
            "suggestions": [
                {
                    "keyword": "Docker",
                    "suggestion": "Integrate Docker into the project description for the e-commerce app: 'Dockerized the application for containerized deployment...'",
                    "riskOfStuffing": "Low"
                }
            ],
            "overallOptimizationLevel": "Medium"
        }

        feedback = payload.get("__retry_feedback__", "")
        prompt = (
            f"Compare the candidate's profile with the job description and identify missing keywords.\n"
            f"Candidate Profile:\n{json.dumps(profile, indent=2)}\n\n"
            f"Job Profile:\n{json.dumps(job_profile, indent=2)}\n\n"
            f"{feedback}"
        )
        system = "You are a Keyword Optimization Agent. Identify missing keywords and suggest natural insertion locations."
        
        return model_router.generate_structured(
            prompt=prompt,
            schema_template=template,
            system_prompt=system,
            temperature=0.2,
            complexity=self.complexity,
            task_name=self.name
        )

    def validate(self, output: Dict[str, Any]) -> bool:
        if not output:
            return False
        return "missingKeywords" in output and "suggestions" in output
