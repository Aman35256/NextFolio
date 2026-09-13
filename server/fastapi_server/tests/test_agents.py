import pytest
from unittest.mock import patch, MagicMock

# Import agents
from app.agents.resume_parsing import ResumeParsingAgent
from app.agents.ats_analysis import ATSAnalysisAgent
from app.agents.resume_improvement import ResumeImprovementAgent

@patch("app.model_router.model_router.generate_structured")
def test_resume_parsing_agent(mock_generate):
    mock_parsed = {
        "personal": {
            "fullName": "John Doe",
            "email": "john@example.com",
            "phone": "123-456",
            "location": "Boston, MA",
            "summary": "Experienced Engineer"
        },
        "experience": [],
        "education": [],
        "skills": ["React", "Python"],
        "certifications": [],
        "projects": [],
        "languages": [],
        "achievements": [],
        "yearsOfExperience": 5.0
    }
    mock_generate.return_value = mock_parsed

    agent = ResumeParsingAgent()
    res = agent.run({"resumeText": "John Doe. Experienced Engineer. React, Python."})
    
    assert res["status"] == "completed"
    assert res["confidence"] == 95
    assert res["output"]["personal"]["fullName"] == "John Doe"
    assert "React" in res["output"]["skills"]

@patch("app.model_router.model_router.generate_structured")
@patch("app.agents.base.BaseAgent.query_rag")
def test_ats_analysis_agent(mock_rag, mock_generate):
    mock_rag.return_value = "ATS scoring tips..."
    mock_eval = {
        "atsScore": 85,
        "evaluation": {
            "formatting": "Excellent layout.",
            "length": "Good.",
            "keywords": "Matching.",
            "actionVerbs": "Strong.",
            "readability": "Excellent."
        },
        "priorities": []
    }
    mock_generate.return_value = mock_eval

    agent = ATSAnalysisAgent()
    res = agent.run({"profile": {}, "jobProfile": {}})
    
    assert res["status"] == "completed"
    assert res["output"]["atsScore"] == 85
    assert res["validation"] == "Passed"

@patch("app.model_router.model_router.generate_structured")
def test_resume_improvement_agent_validation_failure_and_retry(mock_generate):
    # First call returns empty (fails validation), second call succeeds
    mock_generate.side_effect = [
        {},  # Fails validation
        {
            "improvedSummary": "Improved summary",
            "improvedExperience": [],
            "improvedProjects": [],
            "suggestedSkills": [],
            "writingStyles": {}
        }    # Succeeds on retry
    ]

    agent = ResumeImprovementAgent()
    res = agent.run({"profile": {}})
    
    assert res["status"] == "completed"
    assert res["output"]["improvedSummary"] == "Improved summary"
    assert mock_generate.call_count == 2

@patch("app.model_router.model_router.generate_structured")
@patch("app.agents.base.BaseAgent.query_rag")
def test_ai_learning_tutor_agent(mock_rag, mock_generate):
    mock_rag.return_value = "Docker tutoring guides..."
    mock_reply = {
        "reply": "Docker is a containerization platform..."
    }
    mock_generate.return_value = mock_reply

    from app.agents.ai_learning_tutor import AILearningTutorAgent
    agent = AILearningTutorAgent()
    res = agent.run({"message": "Explain Docker", "chatHistory": [], "skillNames": ""})
    
    assert res["status"] == "completed"
    assert res["output"]["reply"] == "Docker is a containerization platform..."
    assert res["validation"] == "Passed"

