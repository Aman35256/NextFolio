import json
from typing import Dict, Any
from app.agents.base import BaseAgent
from app.model_router import model_router

class LinkedInOptimizationAgent(BaseAgent):
    def __init__(self):
        super().__init__("LinkedInOptimizationAgent", complexity="medium")

    def plan(self, payload: Dict[str, Any]) -> str:
        return "Formulating recruiter-optimized headlines, summaries, and experience sections for LinkedIn."

    def reason(self, payload: Dict[str, Any]) -> str:
        return "Analyzing industry trends and recruiter search patterns to maximize keyword matching."

    def execute_task(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        profile = payload.get("profile", {})
        
        template = {
            "headline": "Senior Software Engineer | React, Node.js, AWS | Building Scalable SaaS Platforms",
            "summary": "Results-driven Software Engineer with 6+ years of experience specializing in frontend architectures...",
            "experience": [
                {
                    "company": "Company",
                    "role": "Role",
                    "optimizedBullets": [
                        "Architected micro-frontend systems using React and TypeScript, increasing developer velocity by 20%."
                    ]
                }
            ],
            "skills": ["React", "TypeScript", "Node.js", "AWS", "System Design"],
            "featuredSectionSuggestions": ["Link to your portfolio website", "Link to your top GitHub project NextFolio"]
        }

        feedback = payload.get("__retry_feedback__", "")
        prompt = (
            f"Optimize this candidate's profile for LinkedIn to attract recruiters.\n"
            f"Candidate Profile:\n{json.dumps(profile, indent=2)}\n\n"
            f"{feedback}"
        )
        system = "You are a LinkedIn Optimization Agent. Generate recruiter-friendly headlines and summaries."
        
        return model_router.generate_structured(
            prompt=prompt,
            schema_template=template,
            system_prompt=system,
            temperature=0.4,
            complexity=self.complexity,
            task_name=self.name
        )

    def validate(self, output: Dict[str, Any]) -> bool:
        if not output:
            return False
        return "headline" in output and "summary" in output
