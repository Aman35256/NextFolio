import json
from typing import Dict, Any
from app.agents.base import BaseAgent
from app.model_router import model_router

class ATSAnalysisAgent(BaseAgent):
    def __init__(self):
        super().__init__("ATSAnalysisAgent", complexity="medium")

    def plan(self, payload: Dict[str, Any]) -> str:
        return "Comparing candidate profile against target job description and evaluating ATS score, keyword gaps, and formatting compliance."

    def reason(self, payload: Dict[str, Any]) -> str:
        return "Retrieving ATS parser guidelines and checking section completeness, action verbs, and readability."

    def execute_task(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        profile = payload.get("profile", {})
        job_profile = payload.get("jobProfile", {})
        
        # Retrieve ATS guidelines from RAG
        rag_context = self.query_rag("ATS scoring algorithms layout formatting keyword density", top_k=2)

        template = {
            "atsScore": 70,
            "evaluation": {
                "formatting": "Good layout. Single-column format is ATS compliant.",
                "length": "Resume length is appropriate.",
                "keywords": "Lacks some target keywords from the job description.",
                "actionVerbs": "Strong action verbs are used but can be quantified further.",
                "readability": "Clear formatting, easy to scan."
            },
            "priorities": [
                {
                    "priority": "High",
                    "action": "Add missing keywords like Docker, CI/CD to matching experience points."
                },
                {
                    "priority": "Medium",
                    "action": "Quantify bullet points with metric achievements."
                }
            ]
        }

        feedback = payload.get("__retry_feedback__", "")
        prompt = (
            f"Evaluate this candidate profile against the target job description using ATS guidelines.\n"
            f"ATS Guidelines:\n{rag_context}\n\n"
            f"Candidate Profile:\n{json.dumps(profile, indent=2)}\n\n"
            f"Target Job Description:\n{json.dumps(job_profile, indent=2)}\n\n"
            f"{feedback}"
        )
        system = "You are an ATS Analysis Agent. Calculate ATS scores and identify keyword gaps and formatting issues."
        
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
        return "atsScore" in output and "evaluation" in output
