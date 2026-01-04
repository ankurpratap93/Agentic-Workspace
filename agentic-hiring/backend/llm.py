import os
from typing import Dict, Any
import litellm

# Environment-driven configuration
LITELLM_MODEL = os.getenv("LITELLM_MODEL", "hackathon-gemini-2.5-pro")
LITELLM_API_KEY = os.getenv("LITELLM_API_KEY") or os.getenv("GEMINI_API_KEY")
LITELLM_TIMEOUT = float(os.getenv("LITELLM_TIMEOUT", "20"))
LITELLM_API_BASE = os.getenv("LITELLM_BASE_URL") or os.getenv("OPENAI_API_BASE") or os.getenv("OPENAI_API_URL")


class LLMError(Exception):
    pass


def call_llm(
    prompt: str,
    system: str = "",
    max_tokens: int = 512,
    temperature: float = 0.3,
    response_format=None,
    model: str = None,
) -> str:
    """
    Thin wrapper over LiteLLM completion. Expects env vars:
    - LITELLM_API_KEY or GEMINI_API_KEY
    - LITELLM_MODEL (default: hackathon-gemini-2.5-pro)
    """
    if not LITELLM_API_KEY:
        raise LLMError("Missing LITELLM_API_KEY/GEMINI_API_KEY. Please set the environment variable.")

    try:
        use_model = model or LITELLM_MODEL
        
        # Set API key for litellm
        if LITELLM_API_KEY:
            os.environ["OPENAI_API_KEY"] = LITELLM_API_KEY
        
        resp = litellm.completion(
            model=use_model,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": prompt},
            ],
            max_tokens=max_tokens,
            temperature=temperature,
            timeout=LITELLM_TIMEOUT,
            response_format=response_format,
            api_base=LITELLM_API_BASE,
            api_key=LITELLM_API_KEY,
            # Force OpenAI-compatible provider so Gemini names don't trigger Vertex ADC
            custom_llm_provider="openai" if LITELLM_API_BASE else None,
        )
        return resp["choices"][0]["message"]["content"]
    except Exception as e:
        raise LLMError(f"LLM call failed: {e}") from e


def call_llm_json(
    prompt: str,
    system: str = "",
    max_tokens: int = 1024,
    temperature: float = 0.2,
) -> Dict[str, Any]:
    """
    Asks model for JSON and parses it; errors if JSON is invalid.
    """
    import json
    import re

    content = call_llm(
        prompt=prompt,
        system=(system + "\nRespond ONLY with strict JSON.").strip(),
        max_tokens=max_tokens,
        temperature=temperature,
        response_format={"type": "json_object"},
    )
    # Some providers still return fenced JSON; strip if needed.
    def _strip_json(text: str) -> str:
        cleaned = text.strip()
        if cleaned.startswith("```"):
            cleaned = re.sub(r"^```json", "", cleaned, flags=re.IGNORECASE).strip()
            cleaned = re.sub(r"^```", "", cleaned).strip()
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3].strip()
        return cleaned

    cleaned = _strip_json(content or "")
    try:
        return json.loads(cleaned)
    except Exception as e:
        raise LLMError(f"Invalid JSON from model: {e}; content={cleaned[:200]}") from e

