"""Reasoning API router.

Endpoints:
  GET  /api/reasoning/status   — Ollama availability + model info
  POST /api/reasoning/sitrep   — Generate Situation Report
  POST /api/reasoning/explain  — Explain a Commander recommendation
  POST /api/reasoning/handover — Generate shift handover briefing
  POST /api/reasoning/report   — Generate After Action Report
"""
from fastapi import APIRouter
from pydantic import BaseModel

from agents.commander_agent import commander_agent
from agents.reasoning_agent import reasoning_agent
from services.ollama_service import is_available, OLLAMA_HOST, OLLAMA_MODEL

router = APIRouter(prefix="/api/reasoning", tags=["reasoning"])


class ExplainRequest(BaseModel):
    recommendation_index: int = 0   # index into latest recommendations


# ── endpoints ─────────────────────────────────────────────────────────────────

@router.get("/status")
def reasoning_status():
    """Return Ollama availability and configured model."""
    return {
        "ollama_available": is_available(),
        "ollama_host":      OLLAMA_HOST,
        "model":            OLLAMA_MODEL,
        "fallback_active":  not is_available(),
    }


@router.post("/sitrep")
def generate_sitrep():
    """Generate a Situation Report from current COP + Commander recommendations."""
    recs = commander_agent.get_log()[:1]   # latest log entry as context
    recommendations = _latest_recs()
    return reasoning_agent.generate_sitrep(recommendations)


@router.post("/explain")
def explain_decision(body: ExplainRequest):
    """Explain a specific Commander recommendation."""
    recs = _latest_recs()
    if not recs:
        return {"type": "explanation", "text": "No recommendations available yet.", "llm_used": False}
    idx = min(body.recommendation_index, len(recs) - 1)
    return reasoning_agent.explain_decision(recs[idx])


@router.post("/handover")
def generate_handover():
    """Generate a shift handover briefing."""
    return reasoning_agent.generate_handover(_latest_recs())


@router.post("/report")
def generate_report():
    """Generate an After Action Report."""
    return reasoning_agent.generate_after_action_report(_latest_recs())


# ── helpers ───────────────────────────────────────────────────────────────────

# Shared cache — populated by the reasoning node in the LangGraph workflow
_cached_recommendations: list[dict] = []


def set_cached_recommendations(recs: list[dict]) -> None:
    global _cached_recommendations
    _cached_recommendations = recs


def _latest_recs() -> list[dict]:
    """Return the most recent Commander recommendations from the workflow cache."""
    return list(_cached_recommendations)
