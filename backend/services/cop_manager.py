"""Common Operating Picture (COP) Manager.

The COP is the single source of truth for the Commander Agent.
Every agent writes its observations here; the Commander reads only COP.

Architecture rule: no agent may pass data directly to another agent.
All inter-agent communication flows through the COP.
"""
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any


@dataclass
class WeatherSnapshot:
    condition: str = "Clear"          # Clear | Rain | Heavy Rain | Extreme
    rainfall_mm_hr: float = 0.0
    alert_level: str = "Green"        # Green | Yellow | Orange | Red
    wind_kmh: float = 0.0
    visibility: str = "Good"


@dataclass
class FloodSnapshot:
    detected: bool = False
    coverage_percent: int = 0
    risk_level: str = "Low"           # Low | Medium | High | Critical
    water_depth: str = "none"         # none | shallow | moderate | deep
    affected_zones: list[str] = field(default_factory=list)
    source: str = "none"              # none | vision | simulation


@dataclass
class IncidentSnapshot:
    id: str = ""
    location: str = ""
    incident_type: str = "unknown"
    severity_label: str = "Low"
    severity_score: int = 0
    people_count: int | None = None
    facility: str | None = None
    status: str = "Open"
    confidence: int = 0


@dataclass
class ResourceSnapshot:
    id: str = ""
    type: str = ""
    status: str = "Available"
    location: str = ""
    assigned_to: str | None = None


@dataclass
class RouteSnapshot:
    assignment_id: str = ""
    resource_id: str = ""
    origin: str = ""
    destination: str = ""
    status: str = "Active"            # Active | Rerouted | Blocked
    eta_minutes: float = 0.0
    delay_minutes: float = 0.0


@dataclass
class RoadClosureSnapshot:
    edge_id: str = ""
    road_name: str = ""
    location: str = ""


@dataclass
class CommonOperatingPicture:
    """Full shared state updated by all agents, read by Commander."""

    # Simulation clock
    sim_time: str = "09:00"
    sim_minutes: int = 540
    sim_running: bool = False

    # Weather layer
    weather: WeatherSnapshot = field(default_factory=WeatherSnapshot)

    # Flood / vision layer
    flood: FloodSnapshot = field(default_factory=FloodSnapshot)

    # Emergency incidents (active, non-resolved)
    incidents: list[IncidentSnapshot] = field(default_factory=list)

    # Logistics layer
    resources: list[ResourceSnapshot] = field(default_factory=list)
    routes: list[RouteSnapshot] = field(default_factory=list)
    road_closures: list[RoadClosureSnapshot] = field(default_factory=list)

    # Derived priority zone (set by Commander)
    priority_zone: str = ""
    priority_score: float = 0.0

    # Metadata
    last_updated: str = field(default_factory=lambda: datetime.now().strftime("%H:%M:%S"))
    update_count: int = 0

    def to_dict(self) -> dict[str, Any]:
        from dataclasses import asdict
        return asdict(self)


# ── Module-level singleton ────────────────────────────────────────────────────
_cop = CommonOperatingPicture()


def get_cop() -> CommonOperatingPicture:
    return _cop


def reset_cop() -> None:
    global _cop
    _cop = CommonOperatingPicture()


def update_cop(**kwargs) -> CommonOperatingPicture:
    """Patch top-level scalar fields on the COP and bump update_count."""
    cop = get_cop()
    for k, v in kwargs.items():
        if hasattr(cop, k):
            setattr(cop, k, v)
    cop.last_updated = datetime.now().strftime("%H:%M:%S")
    cop.update_count += 1
    return cop
