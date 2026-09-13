import json
from typing import Dict, Any
from app.agents.base import BaseAgent
from app.model_router import model_router

class ResumeParsingAgent(BaseAgent):
    def __init__(self):
        super().__init__("ResumeParsingAgent", complexity="small")

    def plan(self, payload: Dict[str, Any]) -> str:
        return "Parsing raw resume text into structured JSON fields (personal, experience, education, projects, skills, certifications, achievements, languages)."

    def reason(self, payload: Dict[str, Any]) -> str:
        return "Determining candidate layout, section headers, and temporal order of experiences."

    def execute_task(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        text = payload.get("resumeText", "")
        if not text.strip():
            return {}

        template = {
            "personal": {
                "fullName": "",
                "email": "",
                "phone": "",
                "location": "",
                "summary": ""
            },
            "experience": [
                {
                    "company": "",
                    "role": "",
                    "duration": "",
                    "description": ""
                }
            ],
            "education": [
                {
                    "institution": "",
                    "degree": "",
                    "field": "",
                    "year": 2024
                }
            ],
            "skills": [],
            "certifications": [
                {
                    "name": "",
                    "issuer": "",
                    "year": 2023
                }
            ],
            "projects": [
                {
                    "title": "",
                    "description": "",
                    "technologies": []
                }
            ],
            "languages": [],
            "achievements": [],
            "yearsOfExperience": 0.0
        }

        feedback = payload.get("__retry_feedback__", "")
        prompt = f"Extract all details from this resume text. {feedback}\n\nResume Text:\n{text}"
        system = "You are an expert Resume Parsing Agent. Extract structured JSON metadata accurately."
        
        return model_router.generate_structured(
            prompt=prompt,
            schema_template=template,
            system_prompt=system,
            temperature=0.1,
            complexity=self.complexity,
            task_name=self.name
        )

    def validate(self, output: Dict[str, Any]) -> bool:
        # Require at least a name and some parsed skills or experience
        if not output:
            return False
        personal = output.get("personal", {})
        return bool(personal.get("fullName")) or len(output.get("skills", [])) > 0
