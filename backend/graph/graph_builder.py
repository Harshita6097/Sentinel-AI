"""LangGraph graph state definition.

AgentState is the typed dict threaded through every node in the
Commander workflow graph. It carries lightweight references and
status flags — the full data lives in the COP singleton.

Design: nodes write to the COP directly and record their status
in AgentState so edges can make routing decisions.
"""
from typing import TypedDict, Any


class AgentState(TypedDict, total=False):
    # Simulation snapshot passed into the graph
    sim_minutes: int
    sim_time: str
    sim_events: list[dict]          # active simulation events

    # Per-node completion flags (set to True when node finishes)
    simulation_done: bool
    weather_done: bool
    vision_done: bool
    emergency_done: bool
    logistics_done: bool
    commander_done: bool
    reasoning_done: bool

    # Commander outputs (written by commander node, read by API)
    recommendations: list[dict]
    decision_log_entry: dict | None

    # Error tracking
    errors: list[str]
