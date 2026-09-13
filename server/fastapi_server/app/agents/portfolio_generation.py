import json
from typing import Dict, Any
from app.agents.base import BaseAgent
from app.model_router import model_router

class PortfolioGenerationAgent(BaseAgent):
    def __init__(self):
        super().__init__("PortfolioGenerationAgent", complexity="coding")

    def plan(self, payload: Dict[str, Any]) -> str:
        return "Creating portfolio layouts, sections, and generating responsive HTML and React source code."

    def reason(self, payload: Dict[str, Any]) -> str:
        return "Determining layout themes, interactive components, and visual styling appropriate for candidate's field."

    def execute_task(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        profile = payload.get("profile", {})

        template = {
            "title": "John Doe - Senior Software Engineer Portfolio",
            "sections": ["Hero", "About", "Skills", "Experience", "Projects", "Contact"],
            "htmlContent": "<!DOCTYPE html><html><head>...</head><body>...</body></html>",
            "reactContent": "import React from 'react';\nexport default function Portfolio() {\n  return (\n    <div>...</div>\n  );\n}",
            "cssStyles": "/* Custom premium variables and micro-animations */",
            "responsiveLayouts": {
                "mobile": "Single column flex layout with burger menu.",
                "desktop": "Multi-column grid layout with sticky navigation."
            }
        }

        feedback = payload.get("__retry_feedback__", "")
        prompt = (
            f"Generate a premium, responsive portfolio website (HTML/CSS and React version) based on the candidate's profile.\n"
            f"Ensure rich aesthetics, modern colors, and smooth CSS transitions.\n"
            f"Candidate Profile:\n{json.dumps(profile, indent=2)}\n\n"
            f"{feedback}"
        )
        system = "You are a Portfolio Generation Agent. Generate beautiful portfolio websites including HTML and React."
        
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
        return "htmlContent" in output and "reactContent" in output
