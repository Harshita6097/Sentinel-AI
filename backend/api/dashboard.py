"""Dashboard aggregation API.

Composes existing service data into three efficient endpoints.
No business logic lives here — all data comes from existing singletons.

Endpoints:
  GET /api/dashboard/state   — full unified snapshot (sim + COP + logistics + incidents)
  GET /api/dashboard/events  — merged chronological activity feed
  GET /api/dashboard/alerts  — active high-priority alerts only
"""
from fastapi import APIRouter
from simulation.state_manager import get_state
from services.cop_manager import get_cop
from agents.logistics_agent import logistics_agent
from services import incident_store

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/state")
def get_dashboard_state():
    """
    Single endpoint that returns everything the unified dashboard needs.
    Aggregates: simulation state, COP, logistics resources/routes/network, incidents.
    """
    sim  = get_state()
    cop  = get_cop()
    rm   = logistics_agent.resource_manager
    rep  = logistics_agent.replanner
    cm   = logistics_agent.closure_manager
    net  = logistics_agent.get_road_network()

    return {
        "sim": {
            "time":             sim.current_time,
            "current_minutes":  sim.current_minutes,
            "paused":           sim.paused,
            "finished":         sim.finished,
            "speed":            sim.speed,
            "progress":         round(sim.progress, 4),
            "active_events": [
                {
                    "id": e.id, "time": e.time, "type": e.type,
                    "location": e.location, "severity": e.severity,
                    "description": e.description, "affects": list(e.affects),
                }
                for e in sim.active_events
            ],
            "location_overrides": {str(k): v for k, v in sim.location_overrides.items()},
        },
        "cop": cop.to_dict(),
        "resources": [
            {
                "id": r.id, "type": r.type, "status": r.status,
                "location": r.location, "capacity": r.capacity,
                "speed_kmh": r.speed_kmh, "assigned_to": r.assigned_to,
            }
            for r in rm.list_all()
        ],
        "routes": [
            {
                "assignment_id": a.assignment_id,
                "resource_id":   a.resource_id,
                "origin":        a.origin,
                "destination":   a.destination,
                "route":         a.route.route,
                "edge_ids":      a.route.edge_ids,
                "status":        a.status,
                "eta_minutes":   a.eta.eta_minutes,
                "delay_minutes": a.eta.delay_minutes,
                "arrival_time":  a.eta.arrival_time,
                "reachable":     a.route.reachable,
            }
            for a in rep.list_assignments()
        ],
        "road_closures": [
            {"edge_id": c.edge_id, "road_name": c.road_name, "reason": c.reason}
            for c in cm.list_closures()
        ],
        "network": net,
    }


@router.get("/events")
def get_dashboard_events():
    """
    Merged activity feed combining simulation events, incidents, and logistics updates.
    Returns newest-first, capped at 50 entries.
    """
    entries = []

    # Simulation events
    sim = get_state()
    for e in sim.active_events:
        entries.append({
            "source":      "simulation",
            "time":        e.time,
            "type":        e.type,
            "severity":    e.severity,
            "location":    e.location,
            "description": e.description,
            "icon":        _sim_icon(e.type),
        })

    # Emergency incidents
    for inc in incident_store.list_all(limit=20):
        entries.append({
            "source":      "emergency",
            "time":        inc.time,
            "type":        inc.incident_type,
            "severity":    inc.severity_label.lower(),
            "location":    inc.location or "",
            "description": inc.raw_text[:120],
            "icon":        "🚨",
            "incident_id": inc.id,
        })

    # Logistics assignments
    for a in logistics_agent.replanner.list_assignments():
        entries.append({
            "source":      "logistics",
            "time":        a.eta.arrival_time,
            "type":        "assignment",
            "severity":    "low" if a.status == "Active" else "high",
            "location":    a.destination,
            "description": a.explanation,
            "icon":        "🚚",
        })

    # Commander decisions
    try:
        from agents.commander_agent import commander_agent
        for entry in commander_agent.get_log()[:5]:
            entries.append({
                "source":      "commander",
                "time":        entry["time"],
                "type":        "decision",
                "severity":    "medium",
                "location":    entry.get("location", ""),
                "description": entry["action"],
                "icon":        "🧠",
                "confidence":  entry.get("confidence"),
            })
    except Exception:
        pass

    # Sort by time string descending (HH:MM), newest first
    entries.sort(key=lambda x: x.get("time", "00:00"), reverse=True)
    return entries[:50]


@router.get("/alerts")
def get_dashboard_alerts():
    """
    Active high-priority alerts only (critical/high severity, unresolved).
    Used by the notification system and alert center.
    """
    alerts = []

    # Critical/high incidents
    for inc in incident_store.list_all(status="Open"):
        if inc.severity_label in ("Critical", "High"):
            alerts.append({
                "id":       f"inc-{inc.id}",
                "type":     "incident",
                "severity": inc.severity_label.lower(),
                "title":    f"{inc.severity_label} {inc.incident_type.title()} — {inc.location or 'Unknown'}",
                "detail":   inc.raw_text[:100],
                "time":     inc.time,
                "icon":     "🚨",
            })

    # Road closures
    for c in logistics_agent.closure_manager.list_closures():
        alerts.append({
            "id":       f"road-{c.edge_id}",
            "type":     "road_closure",
            "severity": "high",
            "title":    f"Road Blocked — {c.road_name}",
            "detail":   c.reason,
            "time":     get_state().current_time,
            "icon":     "🚧",
        })

    # Blocked routes
    for a in logistics_agent.replanner.list_assignments():
        if a.status == "Blocked":
            alerts.append({
                "id":       f"route-{a.assignment_id}",
                "type":     "route_blocked",
                "severity": "high",
                "title":    f"Route Blocked — {a.resource_id} to {a.destination}",
                "detail":   a.explanation,
                "time":     get_state().current_time,
                "icon":     "⛔",
            })

    # Weather red alert
    cop = get_cop()
    if cop.weather.alert_level == "Red":
        alerts.append({
            "id":       "weather-red",
            "type":     "weather",
            "severity": "critical",
            "title":    f"Red Weather Alert — {cop.weather.condition}",
            "detail":   f"{cop.weather.rainfall_mm_hr}mm/hr rainfall, {cop.weather.wind_kmh}km/h wind",
            "time":     cop.sim_time,
            "icon":     "⛈️",
        })

    alerts.sort(key=lambda a: ("critical", "high", "medium", "low").index(a["severity"]))
    return alerts


# ── helpers ───────────────────────────────────────────────────────────────────

_SIM_ICONS = {
    "hospital_sos":     "🏥",
    "road_blocked":     "🚧",
    "shelter_capacity": "🏕️",
    "flood":            "🌊",
    "resource_deploy":  "📦",
    "rescue":           "🚁",
    "weather":          "⛈️",
}

def _sim_icon(event_type: str) -> str:
    return _SIM_ICONS.get(event_type, "📡")
