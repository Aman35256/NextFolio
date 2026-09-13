import pytest
from unittest.mock import patch, MagicMock
from app.model_router import ModelRouter

def test_model_routing_logic():
    router = ModelRouter()
    
    # Test routing by complexity
    assert router.route_task("parse", complexity="small") == "phi4:mini"
    assert router.route_task("ats", complexity="medium") == "qwen2.5:7b"
    assert router.route_task("roadmap", complexity="large") == "llama3.3"
    
    # Coding / Portfolio task routing
    assert router.route_task("GeneratePortfolio", complexity="medium") == "qwen2.5-coder:7b"

@patch("app.model_router.ModelRouter._call_local_transformers")
@patch("app.model_router.check_url_active")
def test_router_fallback_to_mock_when_offline(mock_check, mock_transformers):
    # Mock both vLLM, Ollama, and local transformers as inactive/failed
    mock_check.return_value = False
    mock_transformers.side_effect = RuntimeError("Local transformers failed")
    
    router = ModelRouter()
    assert router.vllm_active is False
    assert router.ollama_active is False
    
    # When all backends are offline, structured generation should gracefully return the template
    template = {
        "reasoning": "Standard reasoning",
        "atsScore": 70
    }
    
    res = router.generate_structured(
        prompt="Optimize resume",
        schema_template=template,
        complexity="medium"
    )
    
    assert res["atsScore"] == 70
    assert "offline" in res["reasoning"].lower() or "fallback" in res["reasoning"].lower()
