"""Ollama Service — local LLM inference client.

Wraps the Ollama HTTP API with:
  - connection health check
  - configurable timeout and retry
  - graceful fallback (returns None on any failure)

Model and host are read from environment variables:
  OLLAMA_HOST  (default: http://127.0.0.1:11434)
  OLLAMA_MODEL (default: qwen2.5:3b-instruct)
"""
import logging
import os
import time

import httpx

logger = logging.getLogger(__name__)

OLLAMA_HOST  = os.getenv("OLLAMA_HOST",  "http://127.0.0.1:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen2.5:3b-instruct")

_TIMEOUT   = 60.0   # seconds per request
_MAX_RETRY = 2


def is_available() -> bool:
    """Return True if Ollama is reachable and the configured model is present."""
    try:
        r = httpx.get(f"{OLLAMA_HOST}/api/tags", timeout=3.0)
        if r.status_code != 200:
            return False
        models = [m["name"] for m in r.json().get("models", [])]
        return any(OLLAMA_MODEL in m for m in models)
    except Exception:
        return False


def generate(prompt: str, system: str = "") -> str | None:
    """
    Send a prompt to Ollama and return the response text.

    Args:
        prompt: User-facing prompt text.
        system: Optional system instruction.

    Returns:
        Generated text string, or None if Ollama is unavailable / errors.
    """
    payload: dict = {
        "model":  OLLAMA_MODEL,
        "prompt": prompt,
        "stream": False,
        "options": {"temperature": 0.3, "num_predict": 512},
    }
    if system:
        payload["system"] = system

    for attempt in range(1, _MAX_RETRY + 1):
        try:
            r = httpx.post(
                f"{OLLAMA_HOST}/api/generate",
                json=payload,
                timeout=_TIMEOUT,
            )
            r.raise_for_status()
            return r.json().get("response", "").strip()
        except httpx.TimeoutException:
            logger.warning("Ollama timeout (attempt %d/%d)", attempt, _MAX_RETRY)
        except httpx.HTTPStatusError as e:
            logger.warning("Ollama HTTP error %s", e.response.status_code)
            break
        except Exception as e:
            logger.warning("Ollama error: %s", e)
            break
        if attempt < _MAX_RETRY:
            time.sleep(1)

    return None
