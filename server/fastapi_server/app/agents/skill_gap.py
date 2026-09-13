import json
from typing import Dict, Any
from app.agents.base import BaseAgent
from app.model_router import model_router

class SkillGapAgent(BaseAgent):
    def __init__(self):
        super().__init__("SkillGapAgent", complexity="medium")

    def plan(self, payload: Dict[str, Any]) -> str:
        return "Analyzing candidate profile against target job description to determine technical skill gaps and form a learning roadmap."

    def reason(self, payload: Dict[str, Any]) -> str:
        return "Comparing candidate's listed skills with job requirements, mapping out difficulty levels and estimated study times."

    def execute_task(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        profile = payload.get("profile", {})
        job_profile = payload.get("jobProfile", {})

        template = {
            "gaps": [
                {
                    "skill": "Docker",
                    "importance": "High",
                    "difficulty": "Medium",
                    "estimatedHours": 15,
                    "recommendedCourses": ["Docker and Kubernetes: The Complete Guide"],
                    "practiceProject": "Containerize your existing NextFolio React application."
                }
            ],
            "overallDifficulty": "Medium",
            "estimatedWeeksToBridge": 3
        }

        feedback = payload.get("__retry_feedback__", "")
        prompt = (
            f"Identify skill gaps and recommend a learning roadmap to bridge them.\n"
            f"Candidate Profile:\n{json.dumps(profile, indent=2)}\n\n"
            f"Target Job Profile:\n{json.dumps(job_profile, indent=2)}\n\n"
            f"{feedback}"
        )
        system = "You are a Skill Gap Agent. Analyze missing skills and map out study courses, difficulty, and timelines."
        
        return model_router.generate_structured(
            prompt=prompt,
            schema_template=template,
            system_prompt=system,
            temperature=0.3,
            complexity=self.complexity,
            task_name=self.name
        )

    def validate(self, output: Dict[str, Any]) -> bool:
        if not output:
            return False
        return "gaps" in output and "estimatedWeeksToBridge" in output
