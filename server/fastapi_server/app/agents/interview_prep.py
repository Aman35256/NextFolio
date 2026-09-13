import json
from typing import Dict, Any
from app.agents.base import BaseAgent
from app.model_router import model_router

class InterviewPreparationAgent(BaseAgent):
    def __init__(self):
        super().__init__("InterviewPreparationAgent", complexity="large")

    def plan(self, payload: Dict[str, Any]) -> str:
        return "Generating technical, behavioral (STAR-based), and coding interview questions customized for the target role."

    def reason(self, payload: Dict[str, Any]) -> str:
        return "Retrieving STAR method interview guides and analyzing role requirements to form relevant questions."

    def execute_task(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        profile = payload.get("profile", {})
        job_profile = payload.get("jobProfile", {})
        
        # Retrieve STAR method from RAG
        rag_context = self.query_rag("STAR method behavioral interview questions situational response", top_k=2)

        template = {
            "behavioralQuestions": [
                {
                    "question": "Tell me about a time you resolved a critical production bug under pressure.",
                    "focusArea": "Problem Solving / Stress Management",
                    "starTips": "Situation: Describe the outage. Task: Your responsibility. Action: The exact debugging steps. Result: Restored service & prevention."
                }
            ],
            "technicalQuestions": [
                {
                    "question": "Explain how React's virtual DOM reconciliation works and how Fiber changes it.",
                    "expectedKeywords": ["reconciliation", "fiber", "concurrency", "scheduler"]
                }
            ],
            "codingQuestions": [
                {
                    "title": "Merge Interval Overlaps",
                    "description": "Given an array of intervals, merge all overlapping intervals.",
                    "difficulty": "Medium"
                }
            ],
            "adaptiveFollowUps": ["What metrics did you monitor to verify the fix?"]
        }

        feedback = payload.get("__retry_feedback__", "")
        prompt = (
            f"Generate tailored interview preparation questions based on the candidate's profile and target job.\n"
            f"STAR Method Context:\n{rag_context}\n\n"
            f"Candidate Profile:\n{json.dumps(profile, indent=2)}\n\n"
            f"Target Job Profile:\n{json.dumps(job_profile, indent=2)}\n\n"
            f"{feedback}"
        )
        system = "You are an Interview Preparation Agent. Generate STAR-based behavioral questions and technical coding tasks."
        
        return model_router.generate_structured(
            prompt=prompt,
            schema_template=template,
            system_prompt=system,
            temperature=0.5,
            complexity=self.complexity,
            task_name=self.name
        )

    def validate(self, output: Dict[str, Any]) -> bool:
        if not output:
            return False
        return "behavioralQuestions" in output and "technicalQuestions" in output
