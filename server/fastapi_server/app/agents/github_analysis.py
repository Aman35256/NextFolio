import json
from typing import Dict, Any
from app.agents.base import BaseAgent
from app.model_router import model_router

class GitHubAnalysisAgent(BaseAgent):
    def __init__(self):
        super().__init__("GitHubAnalysisAgent", complexity="medium")

    def plan(self, payload: Dict[str, Any]) -> str:
        return "Analyzing user's GitHub repository metadata to evaluate code quality, structure, and generate portfolio descriptions."

    def reason(self, payload: Dict[str, Any]) -> str:
        return "Extracting technology stacks, commit activity, and documentation levels to assess project impact."

    def execute_task(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        repos = payload.get("repositories", [])
        
        template = {
            "overallQualityScore": 80,
            "projectEvaluations": [
                {
                    "name": "NextFolio",
                    "techStack": ["React", "Node.js", "SQL"],
                    "strengths": ["Comprehensive README", "Clean folder structure"],
                    "weaknesses": ["Lack of automated tests"],
                    "suggestedResumeBullet": "Developed NextFolio, a full-stack career platform utilizing React and Node.js; optimized SQLite queries reducing response latency by 25%."
                }
            ],
            "improvements": ["Add unit tests to all main repositories", "Increase documentation coverage"]
        }

        feedback = payload.get("__retry_feedback__", "")
        prompt = (
            f"Analyze these GitHub repositories and provide an evaluation of code quality and suggestions.\n"
            f"Repositories:\n{json.dumps(repos, indent=2)}\n\n"
            f"{feedback}"
        )
        system = "You are a GitHub Analysis Agent. Analyze code quality and generate resume bullet points."
        
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
        return "projectEvaluations" in output and "overallQualityScore" in output
