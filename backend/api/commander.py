"""Commander API router.

Endpoints:
  GET  /api/commander/cop              — Current Common Operating Picture
  GET  /api/commander/recommendations  — Latest rescue recommendations
  GET  /api/commander/decision-log     — Chronological decision history
  POST /api/commander/recompute        — Trigger full orchestration cycle
"""
from fastapi import APIRouter

from agents.commander_agent import commander_agent
from graph.workflow import run_workflow
from services.cop_manager import get_cop, reset_cop
from simulation.state_manager import get_state

router = APIRouter(prefix="/api/commander", tags=["commander"])

# Cache last recommendations so GET is always fast
_last_recommendations: list[dict] = []


@router.get("/cop")
def get_cop_endpoint():
    """Return the current Common Operating Picture as a flat dict."""
    return get_cop().to_dict()


@router.get("/recommendations")
def get_recommendations():
    """Return the most recent Commander recommendations."""
    return _last_recommendations


@router.get("/decision-log")
def get_decision_log():
    """Return the full Commander decision log, newest first."""
    return commander_agent.get_log()


@router.post("/recompute")
def recompute():
    """
    Trigger a full LangGraph orchestration cycle.

    Runs: simulation → weather → vision → emergency → logistics → commander
    Updates the COP and returns fresh recommendations.
    """
    global _last_recommendations

    sim = get_state()
    final_state = run_workflow(
        sim_minutes=sim.current_minutes,
        sim_time=sim.current_time,
    )

    recs = final_state.get("recommendations", [])
    _last_recommendations = recs

    return {
        "status": "ok",
        "sim_time": sim.current_time,
        "recommendations_count": len(recs),
        "recommendations": recs,
        "errors": final_state.get("errors", []),
        "log_entry": final_state.get("decision_log_entry"),
    }


@router.post("/reset")
def reset_commander():
    """Reset COP and decision log (used with simulation reset)."""
    reset_cop()
    commander_agent.reset()
    global _last_recommendations
    _last_recommendations = []
    return {"status": "reset"}
