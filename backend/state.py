from typing import Any
from pydantic import BaseModel


class AgentState(BaseModel):
    """Shared state passed between LangGraph agents."""
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
