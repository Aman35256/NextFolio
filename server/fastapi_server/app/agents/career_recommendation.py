import json
from typing import Dict, Any
from app.agents.base import BaseAgent
from app.model_router import model_router

class CareerRecommendationAgent(BaseAgent):
    def __init__(self):
        super().__init__("CareerRecommendationAgent", complexity="large")

    def plan(self, payload: Dict[str, Any]) -> str:
        return "Formulating personalized career roadmaps, salary benchmarks, and alternative career trajectories."

    def reason(self, payload: Dict[str, Any]) -> str:
        return "Analyzing candidate's skill gaps and historical career progress to map out next milestones."

    def execute_task(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        profile = payload.get("profile", {})
        
        # Retrieve career advice from RAG
        rag_context = self.query_rag("career roadmaps learning path salary estimates certifications", top_k=2)

        template = {
            "recommendedPaths": [
                {
                    "title": "Lead Frontend Architect",
                    "estimatedSalary": "$140,000 - $170,000",
                    "timeframe": "1-3 years"
                }
            ],
            "learningRoadmap": [
                {
                    "topic": "System Design & Micro-frontends",
                    "duration": "3 months",
                    "resources": ["Designing Data-Intensive Applications", "Micro-frontends in Action"]
                }
            ],
            "suggestedCertifications": ["AWS Certified Solutions Architect", "CKA"],
            "projectIdeas": [
                {
                    "title": "Distributed Task Scheduler",
                    "description": "Build a multi-tenant distributed job queue using Go/Rust and Redis."
                }
            ],
            "alternativeCareers": ["Developer Advocate", "Technical Product Manager"]
        }

        feedback = payload.get("__retry_feedback__", "")
        prompt = (
            f"Provide career recommendations and a learning roadmap for the candidate.\n"
            f"Career Guideline Context:\n{rag_context}\n\n"
            f"Candidate Profile:\n{json.dumps(profile, indent=2)}\n\n"
            f"{feedback}"
        )
        system = "You are a Career Recommendation Agent. Provide high-quality, actionable career path advice."
        
        return model_router.generate_structured(
            prompt=prompt,
            schema_template=template,
            system_prompt=system,
            temperature=0.6,
            complexity=self.complexity,
            task_name=self.name
        )

    def validate(self, output: Dict[str, Any]) -> bool:
        if not output:
            return False
        return "recommendedPaths" in output and "learningRoadmap" in output
