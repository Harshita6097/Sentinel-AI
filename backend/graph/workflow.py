"""LangGraph workflow compiler.

Builds and compiles the Commander orchestration graph:

  simulation → weather → vision → emergency → logistics → commander → END

The compiled graph is a LangGraph CompiledGraph that can be invoked
with an initial AgentState dict. Each node runs synchronously and
updates the shared COP singleton as a side effect.

Usage:
    from graph.workflow import run_workflow
    result = run_workflow(sim_minutes=600, sim_time="10:00")
"""
from langgraph.graph import StateGraph, END

from graph.graph_builder import AgentState
from graph.nodes import (
    node_simulation,
    node_weather,
    node_vision,
    node_emergency,
    node_logistics,
    node_commander,
)


def _build_graph() -> StateGraph:
    g = StateGraph(AgentState)

    g.add_node("simulation", node_simulation)
    g.add_node("weather",    node_weather)
    g.add_node("vision",     node_vision)
    g.add_node("emergency",  node_emergency)
    g.add_node("logistics",  node_logistics)
    g.add_node("commander",  node_commander)

    g.set_entry_point("simulation")

    g.add_edge("simulation", "weather")
    g.add_edge("weather",    "vision")
    g.add_edge("vision",     "emergency")
    g.add_edge("emergency",  "logistics")
    g.add_edge("logistics",  "commander")
    g.add_edge("commander",  END)

    return g


# Compile once at import time — reused for every orchestration call
_compiled = _build_graph().compile()


def run_workflow(sim_minutes: int = 540, sim_time: str = "09:00") -> AgentState:
    """
    Execute the full Commander orchestration pipeline.

    Args:
        sim_minutes: Current simulation time in minutes since midnight.
        sim_time:    Human-readable time string (HH:MM).

    Returns:
        Final AgentState after all nodes have executed.
    """
    initial: AgentState = {
        "sim_minutes": sim_minutes,
        "sim_time": sim_time,
        "sim_events": [],
        "errors": [],
    }
    return _compiled.invoke(initial)
