import json
from typing import Dict, Any
from app.agents.base import BaseAgent
from app.model_router import model_router

class ResumeImprovementAgent(BaseAgent):
    def __init__(self):
        super().__init__("ResumeImprovementAgent", complexity="large")

    def plan(self, payload: Dict[str, Any]) -> str:
        return "Improving resume summaries, experience descriptions, and projects to sound highly professional and quantified."

    def reason(self, payload: Dict[str, Any]) -> str:
        return "Retrieving resume writing best practices and action verbs to optimize impact metrics."

    def execute_task(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        profile = payload.get("profile", {})
        job_profile = payload.get("jobProfile", {})
        
        # Retrieve best practices
        rag_context = self.query_rag("Resume writing action verbs STAR method quantification metrics", top_k=2)

        template = {
            "improvedSummary": "Senior Frontend Engineer with 6+ years of experience...",
            "improvedExperience": [
                {
                    "company": "Company Name",
                    "role": "Role Title",
                    "originalDescription": "Built features using React",
                    "improvedDescription": "Architected and deployed 15+ high-performance React features, improving page load speed by 35% and increasing user engagement by 20%."
                }
            ],
            "improvedProjects": [
                {
                    "title": "Project Title",
                    "originalDescription": "Built a website",
                    "improvedDescription": "Designed and implemented a responsive web app using Next.js and Tailwind, serving over 10k monthly active users with 99.9% uptime."
                }
            ],
            "suggestedSkills": ["TypeScript", "Next.js", "Docker"],
            "writingStyles": {
                "impactful": "Dynamic, results-driven summary...",
                "technical": "Skill-heavy, architect-focused summary...",
                "minimalist": "Clean, direct summary..."
            }
        }

        feedback = payload.get("__retry_feedback__", "")
        prompt = (
            f"Improve the candidate's resume content to make it highly professional and quantified.\n"
            f"Resume Best Practices:\n{rag_context}\n\n"
            f"Candidate Profile:\n{json.dumps(profile, indent=2)}\n\n"
            f"Target Job Description:\n{json.dumps(job_profile, indent=2)}\n\n"
            f"{feedback}"
        )
        system = "You are a Resume Improvement Agent. Rewrite resume sections to make them highly impactful and professional."
        
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
        return "improvedSummary" in output and "improvedExperience" in output
