"""
AgentState — shared LangGraph graph state.

NOTE: This file is a placeholder for the future LangGraph Commander agent.
The active simulation state lives in simulation/state_manager.py.
The active incident state lives in services/incident_store.py.

This will be wired into LangGraph in a future milestone.
"""
from typing import Any
from pydantic import BaseModel


class AgentState(BaseModel):
    """Shared state passed between LangGraph agents (future use)."""
    session_id: str
    disaster_type: str | None = None
    affected_area: dict[str, Any] | None = None
    sos_reports: list[dict[str, Any]] = []
    satellite_analysis: dict[str, Any] | None = None
    weather_data: dict[str, Any] | None = None
    road_network: dict[str, Any] | None = None
    rescue_priorities: list[dict[str, Any]] = []
    resource_allocation: dict[str, Any] | None = None
    confidence_scores: dict[str, float] = {}
    explanation: str | None = None
