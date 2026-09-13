import json
from typing import Dict, Any
from app.agents.base import BaseAgent
from app.model_router import model_router

class PDFGenerationAgent(BaseAgent):
    def __init__(self):
        super().__init__("PDFGenerationAgent", complexity="coding")

    def plan(self, payload: Dict[str, Any]) -> str:
        return "Compiling candidate profile data into print-ready, ATS-optimized HTML and inline CSS templates."

    def reason(self, payload: Dict[str, Any]) -> str:
        return "Determining margins, fonts, page break rules, and color palettes matching the requested style."

    def execute_task(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        profile = payload.get("profile", {})
        style = payload.get("style", "ATS")  # ATS, Minimal, Executive, Modern, Student

        template = {
            "style": style,
            "htmlTemplate": "<html><style>...</style><body>...</body></html>",
            "pageCount": 1,
            "marginSize": "0.5in",
            "fontSize": "10pt",
            "fontFamily": "Arial, sans-serif"
        }

        feedback = payload.get("__retry_feedback__", "")
        prompt = (
            f"Generate a print-ready HTML resume template for style '{style}' based on the candidate's profile.\n"
            f"Ensure perfect print layout styling (e.g. page-break-inside: avoid, clean margins).\n"
            f"Candidate Profile:\n{json.dumps(profile, indent=2)}\n\n"
            f"{feedback}"
        )
        system = "You are a PDF Generation Agent. Compile candidate profiles into clean HTML/CSS for printing."
        
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
        return "htmlTemplate" in output
