import json
from typing import Dict, Any
from app.agents.base import BaseAgent
from app.model_router import model_router

class EmailUnderstandingAgent(BaseAgent):
    def __init__(self):
        super().__init__("EmailUnderstandingAgent", complexity="medium")

    def plan(self, payload: Dict[str, Any]) -> str:
        return "Analyzing incoming recruitment email content to determine its category, action points, matched application metadata, and key details."

    def reason(self, payload: Dict[str, Any]) -> str:
        return "Using semantic search and pattern analysis to distinguish recruiter interests, interview loops, coding challenges, rejections, and job offers."

    def execute_task(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        sender = payload.get("sender", "")
        subject = payload.get("subject", "")
        body = payload.get("body", "")

        template = {
            "isJobRelated": True,
            "classification": "Interview Invitation",  # 'Application Received', 'Online Assessment', 'Interview Invitation', 'Offer Letter', 'Rejection', 'Ignored/Spam', 'Unknown'
            "confidence": 95,
            "summary": "Google has invited you to a Technical Interview on July 15 at 10:00 AM.",
            "actionRequired": "Confirm your availability and schedule time slots via the calendar link.",
            "extractedDetails": {
                "company": "Google",
                "role": "Software Engineer",
                "date": "2026-07-15",
                "time": "10:00 AM",
                "timezone": "PST",
                "meetingLink": "https://meet.google.com/abc-xyz",
                "interviewerNames": ["Sundar Pichai"],
                "salary": None,
                "deadline": "2026-07-10"
            }
        }

        prompt = (
            f"Analyze the following email from a sender, subject line, and body content.\n"
            f"Determine if it is a recruitment/job application email, classify its status, extract metadata, and summarize key action items.\n\n"
            f"Sender: {sender}\n"
            f"Subject: {subject}\n"
            f"Email Body:\n{body}\n"
        )
        
        system = (
            "You are an Email Intelligence Agent. Analyze recruitment communications. "
            "Accurately classify into 'Application Received', 'Online Assessment', 'Interview Invitation', 'Offer Letter', 'Rejection', 'Ignored/Spam', or 'Unknown'. "
            "Extract dates, times, salary details, and link locations if applicable."
        )

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
        return "classification" in output and "summary" in output
