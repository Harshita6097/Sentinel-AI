"""Logistics API router.

Endpoints:
  GET  /api/logistics/resources       — list all rescue assets
  GET  /api/logistics/routes          — list active assignments
  GET  /api/logistics/network         — road graph + closure state
  POST /api/logistics/assign          — assign resource to destination
  POST /api/logistics/recalculate     — recompute all routes
  POST /api/logistics/event           — inject simulation event (road block etc.)
  POST /api/logistics/reset           — reset logistics state
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from agents.logistics_agent import logistics_agent
from simulation.state_manager import get_state

router = APIRouter(prefix="/api/logistics", tags=["logistics"])


# ── Pydantic schemas ─────────────────────────────────────────────────────────

class ResourceOut(BaseModel):
    id: str
    type: str
    status: str
    location: str
    capacity: int
    speed_kmh: float
    assigned_to: str | None


class AssignmentOut(BaseModel):
    assignment_id: str
    resource_id: str
    resource_type: str
    origin: str
    destination: str
    route: list[str]
    edge_ids: list[str]
    eta_minutes: float
    baseline_minutes: float
    delay_minutes: float
    arrival_time: str
    status: str
    explanation: str
    reachable: bool


class AssignRequest(BaseModel):
    destination: str
    resource_type: str | None = None
    resource_id: str | None = None


class EventRequest(BaseModel):
    event_type: str
    location: str
    event_id: int


# ── endpoints ────────────────────────────────────────────────────────────────

@router.get("/resources", response_model=list[ResourceOut])
def get_resources():
    return [
        ResourceOut(
            id=r.id, type=r.type, status=r.status, location=r.location,
            capacity=r.capacity, speed_kmh=r.speed_kmh, assigned_to=r.assigned_to,
        )
        for r in logistics_agent.resource_manager.list_all()
    ]


@router.get("/routes", response_model=list[AssignmentOut])
def get_routes():
    assignments = logistics_agent.replanner.list_assignments()
    results = []
    for a in assignments:
        resource = logistics_agent.resource_manager.get(a.resource_id)
        rtype = resource.type if resource else "Unknown"
        results.append(AssignmentOut(
            assignment_id=a.assignment_id,
            resource_id=a.resource_id,
            resource_type=rtype,
            origin=a.origin,
            destination=a.destination,
            route=a.route.route,
            edge_ids=a.route.edge_ids,
            eta_minutes=a.eta.eta_minutes,
            baseline_minutes=a.eta.baseline_minutes,
            delay_minutes=a.eta.delay_minutes,
            arrival_time=a.eta.arrival_time,
            status=a.status,
            explanation=a.explanation,
            reachable=a.route.reachable,
        ))
    return results


@router.get("/network")
def get_network():
    return logistics_agent.get_road_network()


@router.post("/assign", response_model=AssignmentOut)
def assign_resource(req: AssignRequest):
    sim_minutes = get_state().current_minutes
    result = logistics_agent.assign_resource(
        destination=req.destination,
        resource_type=req.resource_type,
        resource_id=req.resource_id,
        current_sim_minutes=sim_minutes,
    )
    if result is None:
        raise HTTPException(status_code=404, detail="No available resource found")
    return AssignmentOut(**result.__dict__)


@router.post("/recalculate", response_model=list[AssignmentOut])
def recalculate():
    sim_minutes = get_state().current_minutes
    results = logistics_agent.recalculate_all(sim_minutes)
    return [AssignmentOut(**r.__dict__) for r in results]


@router.post("/event")
def inject_event(req: EventRequest):
    sim_minutes = get_state().current_minutes
    affected = logistics_agent.handle_simulation_event(
        req.event_type, req.location, req.event_id, sim_minutes
    )
    return {
        "blocked_applied": req.event_type == "road_blocked",
        "rerouted_count": len(affected),
        "affected_assignments": [a.assignment_id for a in affected],
    }


@router.post("/reset")
def reset_logistics():
    logistics_agent.reset()
    return {"status": "reset"}
