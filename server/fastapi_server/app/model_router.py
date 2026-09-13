import os
import re
import json
import logging
import urllib.request
from typing import Dict, Any, Optional
from app.config import settings

logger = logging.getLogger("nextfolio.model_router")

# Cache for local HuggingFace transformers pipelines (lazy loading)
_local_pipelines = {}

def check_url_active(url: str) -> bool:
    """Helper to check if a local HTTP endpoint is listening."""
    try:
        req = urllib.request.Request(url, method="GET")
        with urllib.request.urlopen(req, timeout=1.0) as response:
            return response.status in [200, 404, 405]
    except Exception:
        return False

class ModelRouter:
    def __init__(self):
        self.last_check = 0
        self._vllm_active = False
        self._ollama_active = False
        self._update_active_backends()

    def _update_active_backends(self):
        import time
        now = time.time()
        if now - self.last_check > 30:  # check status every 30 seconds
            self._vllm_active = settings.VLLM_URL is not None and check_url_active(settings.VLLM_URL)
            self._ollama_active = check_url_active(settings.OLLAMA_URL)
            self.last_check = now

    @property
    def vllm_active(self) -> bool:
        self._update_active_backends()
        return self._vllm_active

    @property
    def ollama_active(self) -> bool:
        self._update_active_backends()
        return self._ollama_active

    def route_task(self, task_name: str, complexity: str = "medium") -> str:
        """Determines the appropriate model name based on task name and complexity."""
        if complexity == "small":
            return settings.MODEL_SMALL
        elif complexity == "large":
            return settings.MODEL_LARGE
        elif complexity == "coding" or "portfolio" in task_name.lower():
            return settings.MODEL_CODING
        return settings.MODEL_MEDIUM

    def generate(self, prompt: str, system_prompt: str = "You are a helpful assistant.", temperature: float = 0.3, complexity: str = "medium", task_name: str = "") -> str:
        """Generates text from the routed model, preferring OpenAI API for speed if key is available, then falling back to local backends."""
        
        # 0. Check for OpenAI API Key (preferred for speed & quality in local environments without GPU)
        openai_key = os.getenv("OPENAI_API_KEY")
        if not openai_key:
            try:
                parent_env = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))
                if os.path.exists(parent_env):
                    with open(parent_env, "r") as f:
                        for line in f:
                            if line.strip().startswith("OPENAI_API_KEY="):
                                openai_key = line.split("=", 1)[1].strip().strip('"').strip("'")
                                break
            except Exception:
                pass

        if openai_key:
            try:
                model_name = "gpt-4o-mini"
                logger.info(f"Using OpenAI API ({model_name}) for task: {task_name or 'unnamed'}")
                return self._call_openai_api(openai_key, model_name, prompt, system_prompt, temperature)
            except Exception as e:
                logger.error(f"OpenAI API call failed: {e}. Falling back to local backends.")

        model_name = self.route_task(task_name, complexity)
        
        # 1. Try vLLM
        if self.vllm_active:
            try:
                return self._call_openai_compatible(settings.VLLM_URL, model_name, prompt, system_prompt, temperature)
            except Exception as e:
                logger.error(f"vLLM inference failed: {e}. Falling back to Ollama.")
        
        # 2. Try Ollama
        if self.ollama_active:
            try:
                # Ollama has an OpenAI compatible endpoint at /v1
                return self._call_openai_compatible(f"{settings.OLLAMA_URL}/v1", model_name, prompt, system_prompt, temperature)
            except Exception as e:
                logger.error(f"Ollama inference failed: {e}. Falling back to local Transformers.")

        # 3. Try Local HuggingFace Transformers (Lazy Loading & GPU Optimized if CUDA is available)
        try:
            return self._call_local_transformers(model_name, prompt, system_prompt, temperature)
        except Exception as e:
            logger.error(f"Local Transformers inference failed: {e}. Raising error.")
            raise RuntimeError(f"All LLM backends (vLLM, Ollama, Transformers) failed. Detail: {e}")

    def generate_structured(self, prompt: str, schema_template: Dict[str, Any], system_prompt: str = "", temperature: float = 0.3, complexity: str = "medium", task_name: str = "") -> Dict[str, Any]:
        """Generates text and parses it into the specified JSON schema template."""
        full_system = (
            f"{system_prompt}\n"
            "You MUST respond ONLY with a single JSON object. Do not include markdown formatting, headers, or explanations.\n"
            f"Structure your JSON response to match this exact template:\n"
            f"{json.dumps(schema_template, indent=2)}"
        )
        
        try:
            raw_response = self.generate(prompt, full_system, temperature, complexity, task_name)
            cleaned = self._clean_json_string(raw_response)
            parsed = json.loads(cleaned)
            
            if not isinstance(parsed, dict):
                raise ValueError("LLM response is not a JSON object")
            
            # Ensure all keys in the schema_template exist in the response
            for k, v in schema_template.items():
                if k not in parsed:
                    parsed[k] = v
            return parsed
        except Exception as e:
            logger.warning(f"Structured generation failed or was offline: {e}. Returning template-based mock data.")
            mock_data = json.loads(json.dumps(schema_template))
            warning_msg = f"[OFFLINE/FALLBACK] Local model router fallback active. Detail: {str(e)}"
            
            # Populate warning message in common fields
            if "reasoning" in mock_data:
                mock_data["reasoning"] = warning_msg
            if "explanation" in mock_data and isinstance(mock_data["explanation"], dict) and "relevanceSummary" in mock_data["explanation"]:
                mock_data["explanation"]["relevanceSummary"] = warning_msg
            if "feedback" in mock_data:
                mock_data["feedback"] = warning_msg
            return mock_data

    def _call_openai_compatible(self, base_url: str, model: str, prompt: str, system: str, temp: float) -> str:
        url = f"{base_url}/chat/completions"
        payload = {
            "model": model,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": prompt}
            ],
            "temperature": temp
        }
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=45.0) as response:
            res_body = response.read().decode("utf-8")
            parsed = json.loads(res_body)
            return parsed["choices"][0]["message"]["content"]

    def _call_openai_api(self, api_key: str, model: str, prompt: str, system: str, temp: float) -> str:
        url = "https://api.openai.com/v1/chat/completions"
        payload = {
            "model": model,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": prompt}
            ],
            "temperature": temp
        }
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {api_key}"
            },
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=30.0) as response:
            res_body = response.read().decode("utf-8")
            parsed = json.loads(res_body)
            return parsed["choices"][0]["message"]["content"]

    def _call_local_transformers(self, model_name: str, prompt: str, system: str, temp: float) -> str:
        global _local_pipelines
        import torch
        from transformers import pipeline, AutoModelForCausalLM, AutoTokenizer
        
        # Determine local model repository (dynamically scale down on CPU to prevent huge downloads)
        is_cuda = torch.cuda.is_available()
        
        if is_cuda:
            repo_map = {
                settings.MODEL_SMALL: "Qwen/Qwen2.5-1.5B-Instruct",
                settings.MODEL_MEDIUM: "Qwen/Qwen2.5-7B-Instruct",
                settings.MODEL_LARGE: "meta-llama/Llama-3.2-3B-Instruct",
                settings.MODEL_CODING: "Qwen/Qwen2.5-Coder-7B-Instruct"
            }
        else:
            # CPU-friendly lightweight models (extremely fast on CPU)
            repo_map = {
                settings.MODEL_SMALL: "Qwen/Qwen2.5-0.5B-Instruct",
                settings.MODEL_MEDIUM: "Qwen/Qwen2.5-0.5B-Instruct",
                settings.MODEL_LARGE: "Qwen/Qwen2.5-0.5B-Instruct",
                settings.MODEL_CODING: "Qwen/Qwen2.5-0.5B-Instruct"
            }
            
        repo_id = repo_map.get(model_name, "Qwen/Qwen2.5-0.5B-Instruct")
        
        if repo_id not in _local_pipelines:
            logger.info(f"Loading local HuggingFace model: {repo_id}...")
            device = 0 if torch.cuda.is_available() else -1
            torch_dtype = torch.float16 if torch.cuda.is_available() else torch.float32
            
            tokenizer = AutoTokenizer.from_pretrained(repo_id)
            model = AutoModelForCausalLM.from_pretrained(
                repo_id, 
                torch_dtype=torch_dtype, 
                device_map="auto" if device == 0 else None
            )
            _local_pipelines[repo_id] = pipeline(
                "text-generation", 
                model=model, 
                tokenizer=tokenizer
            )
            logger.info(f"Successfully loaded local model {repo_id} to device: {'CUDA' if device == 0 else 'CPU'}")

        pipe = _local_pipelines[repo_id]
        messages = [
            {"role": "system", "content": system},
            {"role": "user", "content": prompt}
        ]
        
        # Apply chat template
        formatted_prompt = pipe.tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
        
        # Generate
        outputs = pipe(
            formatted_prompt,
            max_new_tokens=1024,
            do_sample=True if temp > 0.0 else False,
            temperature=temp if temp > 0.0 else 1.0,
            pad_token_id=pipe.tokenizer.eos_token_id
        )
        
        generated_text = outputs[0]["generated_text"]
        # Extract response after the generation prompt
        if pipe.tokenizer.eos_token in generated_text:
            generated_text = generated_text.split(pipe.tokenizer.eos_token)[0]
        
        # Strip the input prompt if needed
        response = generated_text[len(formatted_prompt):].strip()
        return response

    def _clean_json_string(self, text: str) -> str:
        """Extracts JSON substring from LLM response text, handling code blocks."""
        code_block_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', text, re.DOTALL | re.IGNORECASE)
        if code_block_match:
            return code_block_match.group(1).strip()
        
        json_match = re.search(r'(\{.*\})', text, re.DOTALL)
        if json_match:
            return json_match.group(1).strip()
            
        return text.strip()

model_router = ModelRouter()
