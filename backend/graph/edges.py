"""LangGraph edge conditions.

Edge functions inspect AgentState and return the name of the next
node to execute. This keeps routing logic separate from node logic.
"""
from graph.graph_builder import AgentState


def after_simulation(state: AgentState) -> str:
    """Always proceed to weather after simulation sync."""
    return "weather"


def after_weather(state: AgentState) -> str:
    """Always proceed to vision after weather."""
    return "vision"


def after_vision(state: AgentState) -> str:
    """Always proceed to emergency after vision."""
    return "emergency"


def after_emergency(state: AgentState) -> str:
    """Always proceed to logistics after emergency."""
    return "logistics"


def after_logistics(state: AgentState) -> str:
    """Always proceed to commander after logistics."""
    return "commander"
