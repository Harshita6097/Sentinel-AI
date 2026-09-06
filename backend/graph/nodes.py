"""LangGraph node functions for the Commander workflow.

Each node is a pure function: (AgentState) -> AgentState.
Nodes write their observations to the COP singleton and set
their completion flag in the state dict.

Nodes are independently testable — call any node function directly
with a minimal AgentState dict.
"""
from graph.graph_builder import AgentState
from services.cop_manager import (
    get_cop, update_cop,
    FloodSnapshot, IncidentSnapshot,
    ResourceSnapshot, RouteSnapshot, RoadClosureSnapshot,
)


# ── Node: simulation ──────────────────────────────────────────────────────────

def node_simulation(state: AgentState) -> AgentState:
    """Sync simulation clock and active events into COP."""
    try:
        from simulation.state_manager import get_state
        sim = get_state()
        cop = get_cop()
        cop.sim_time    = sim.current_time
        cop.sim_minutes = sim.current_minutes
        cop.sim_running = not sim.paused
        update_cop()
        return {**state, "simulation_done": True}
    except Exception as e:
        return {**state, "simulation_done": False, "errors": state.get("errors", []) + [f"sim: {e}"]}


# ── Node: weather ─────────────────────────────────────────────────────────────

def node_weather(state: AgentState) -> AgentState:
    """Run weather agent and write forecast to COP."""
    try:
        from agents.weather_agent import weather_agent
        sim_minutes = state.get("sim_minutes", 540)
        weather_agent.update(sim_minutes)
        return {**state, "weather_done": True}
    except Exception as e:
        return {**state, "weather_done": False, "errors": state.get("errors", []) + [f"weather: {e}"]}


# ── Node: vision ──────────────────────────────────────────────────────────────

def node_vision(state: AgentState) -> AgentState:
    """Sync latest vision analysis result into COP flood layer.

    Vision analysis is triggered by image upload (async user action),
    not by the orchestration loop. This node reads the last cached
    result from the vision service and writes it to COP.
    """
    try:
        from services.vision_cop_bridge import get_latest_vision_snapshot
        snapshot = get_latest_vision_snapshot()
        cop = get_cop()
        cop.flood = snapshot
        update_cop()
        return {**state, "vision_done": True}
    except Exception as e:
        return {**state, "vision_done": False, "errors": state.get("errors", []) + [f"vision: {e}"]}


# ── Node: emergency ───────────────────────────────────────────────────────────

def node_emergency(state: AgentState) -> AgentState:
    """Sync active incidents from incident store into COP."""
    try:
        from services import incident_store
        incidents = incident_store.list_all(status="Open")
        cop = get_cop()
        cop.incidents = [
            IncidentSnapshot(
                id=i.id,
                location=i.location or "",
                incident_type=i.incident_type,
                severity_label=i.severity_label,
                severity_score=i.severity_score,
                people_count=i.people_count,
                facility=i.facility,
                status=i.status,
                confidence=i.confidence.get("overall", 0),
            )
            for i in incidents
        ]
        update_cop()
        return {**state, "emergency_done": True}
    except Exception as e:
        return {**state, "emergency_done": False, "errors": state.get("errors", []) + [f"emergency: {e}"]}


# ── Node: logistics ───────────────────────────────────────────────────────────

def node_logistics(state: AgentState) -> AgentState:
    """Sync resources, routes, and road closures from logistics agent into COP."""
    try:
        from agents.logistics_agent import logistics_agent

        rm  = logistics_agent.resource_manager
        rep = logistics_agent.replanner
        cm  = logistics_agent.closure_manager

        cop = get_cop()

        cop.resources = [
            ResourceSnapshot(
                id=r.id, type=r.type, status=r.status,
                location=r.location, assigned_to=r.assigned_to,
            )
            for r in rm.list_all()
        ]

        cop.routes = [
            RouteSnapshot(
                assignment_id=a.assignment_id,
                resource_id=a.resource_id,
                origin=a.origin,
                destination=a.destination,
                status=a.status,
                eta_minutes=a.eta.eta_minutes,
                delay_minutes=a.eta.delay_minutes,
            )
            for a in rep.list_assignments()
        ]

        cop.road_closures = [
            RoadClosureSnapshot(
                edge_id=c.edge_id,
                road_name=c.road_name,
                location=_closure_location(c.edge_id),
            )
            for c in cm.list_closures()
        ]

        update_cop()
        return {**state, "logistics_done": True}
    except Exception as e:
        return {**state, "logistics_done": False, "errors": state.get("errors", []) + [f"logistics: {e}"]}


# ── Node: commander ───────────────────────────────────────────────────────────

def node_commander(state: AgentState) -> AgentState:
    """Read COP, fuse evidence, rank priorities, generate recommendations."""
    try:
        from agents.commander_agent import commander_agent
        result = commander_agent.decide()
        return {
            **state,
            "commander_done": True,
            "recommendations": [r.__dict__ for r in result.recommendations],
            "decision_log_entry": result.log_entry,
        }
    except Exception as e:
        return {
            **state,
            "commander_done": False,
            "errors": state.get("errors", []) + [f"commander: {e}"],
            "recommendations": [],
            "decision_log_entry": None,
        }


# ── helpers ───────────────────────────────────────────────────────────────────

# Edge-id → location mapping (mirrors road_closure_manager._LOCATION_TO_EDGES)
_EDGE_LOCATION: dict[str, str] = {
    "R3": "Alappuzha",
    "R6": "Kottayam",
}

def _closure_location(edge_id: str) -> str:
    return _EDGE_LOCATION.get(edge_id, "")
