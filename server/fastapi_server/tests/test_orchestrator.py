import pytest
from unittest.mock import patch, MagicMock
from app.orchestrator import MasterOrchestrator
from app.agents.base import BaseAgent

@pytest.mark.asyncio
@patch("app.orchestrator.publish_progress")
@patch("app.orchestrator.MasterOrchestrator._save_candidate_profile_to_db")
async def test_orchestrator_pipeline_success(mock_save_db, mock_progress):
    # Define a custom mock function that will be bound to the Agent instances
    def mock_run(self, payload):
        if self.name == "ResumeParsingAgent":
            return {
                "status": "completed",
                "planning": "Mock plan",
                "reasoning": "Mock reasoning",
                "validation": "Passed",
                "executionTime": 5,
                "output": {"fullName": "Alice"}
            }
        elif self.name == "JobDescriptionAgent":
            return {
                "status": "completed",
                "planning": "Mock plan",
                "reasoning": "Mock reasoning",
                "validation": "Passed",
                "executionTime": 5,
                "output": {"role": "Engineer"}
            }
        elif self.name == "ATSAnalysisAgent":
            return {
                "status": "completed",
                "planning": "Mock plan",
                "reasoning": "Mock reasoning",
                "validation": "Passed",
                "executionTime": 5,
                "output": {"atsScore": 90}
            }
        elif self.name == "ContentValidationAgent":
            return {
                "status": "completed",
                "planning": "Mock plan",
                "reasoning": "Mock reasoning",
                "validation": "Passed",
                "executionTime": 5,
                "output": {"validatedContent": {"resumeValid": True}}
            }
        elif self.name == "PDFGenerationAgent":
            return {
                "status": "completed",
                "planning": "Mock plan",
                "reasoning": "Mock reasoning",
                "validation": "Passed",
                "executionTime": 5,
                "output": {"htmlTemplate": "pdf"}
            }
        return {
            "status": "completed",
            "planning": "Mock plan",
            "reasoning": "Mock reasoning",
            "validation": "Passed",
            "executionTime": 5,
            "output": {}
        }
    
    # Patch BaseAgent.run on the class level with our custom function
    with patch.object(BaseAgent, "run", mock_run):
        orchestrator = MasterOrchestrator()
        
        payload = {
            "userId": 1,
            "query": "Optimize my resume",
            "resumeData": "Raw resume text...",
            "jobDescription": "Job Description..."
        }
        
        res = await orchestrator.run_pipeline(payload)
        
        assert res["success"] is True
        assert res["orchestrationId"] is not None
        assert res["context"]["profile"]["fullName"] == "Alice"
        assert res["context"]["jobProfile"]["role"] == "Engineer"
        assert res["context"]["atsAnalysis"]["atsScore"] == 90
        assert res["context"]["pdfTemplate"]["htmlTemplate"] == "pdf"
