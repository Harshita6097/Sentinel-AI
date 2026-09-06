"""Priority Engine — explainable rescue priority scoring.

Formula:  Priority = w1*S + w2*Pop + w3*A + w4*W + w5*R

  S   — Severity score        (0-100)  from incident severity_score
  Pop — Population factor     (0-100)  from people_count and facility type
  A   — Accessibility factor  (0-100)  inverse of road closures / route delays
  W   — Weather factor        (0-100)  from weather alert level
  R   — Resource factor       (0-100)  availability of nearby assets

Weights are configurable via PRIORITY_WEIGHTS dict.
All factor values and weights are returned for full transparency.
"""
from dataclasses import dataclass

from services.cop_manager import (
    CommonOperatingPicture, IncidentSnapshot,
    ResourceSnapshot, RoadClosureSnapshot,
)

# ── Configurable weights (sum = 1.0) ─────────────────────────────────────────
PRIORITY_WEIGHTS: dict[str, float] = {
    "severity":      0.35,
    "population":    0.20,
    "accessibility": 0.20,
    "weather":       0.15,
    "resource":      0.10,
}

_WEATHER_SCORES: dict[str, float] = {
    "Green":  10.0,
    "Yellow": 40.0,
    "Orange": 70.0,
    "Red":    100.0,
}

_SEVERITY_SCORES: dict[str, float] = {
    "Low":      20.0,
    "Medium":   50.0,
    "High":     75.0,
    "Critical": 100.0,
}

_FACILITY_POP_BONUS: dict[str, float] = {
    "hospital": 30.0,
    "shelter":  20.0,
    "school":   25.0,
}


@dataclass
class PriorityFactors:
    severity: float
    population: float
    accessibility: float
    weather: float
    resource: float
    weights: dict[str, float]

    @property
    def total(self) -> float:
        w = self.weights
        return round(
            w["severity"]      * self.severity
            + w["population"]    * self.population
            + w["accessibility"] * self.accessibility
            + w["weather"]       * self.weather
            + w["resource"]      * self.resource,
            1,
        )


@dataclass
class PriorityResult:
    location: str
    score: float                    # 0–100
    rank: int                       # 1 = highest priority
    factors: PriorityFactors
    incident_ids: list[str]


def score_location(
    location: str,
    cop: CommonOperatingPicture,
    weights: dict[str, float] | None = None,
) -> PriorityResult:
    """Compute priority score for a single location using current COP."""
    w = weights or PRIORITY_WEIGHTS

    incidents = [i for i in cop.incidents if i.location == location]
    closures  = cop.road_closures
    resources = cop.resources

    s   = _severity_factor(incidents)
    pop = _population_factor(incidents)
    acc = _accessibility_factor(location, closures, cop.routes)
    wth = _weather_factor(cop.weather.alert_level)
    res = _resource_factor(location, resources)

    factors = PriorityFactors(
        severity=s, population=pop, accessibility=acc,
        weather=wth, resource=res, weights=w,
    )
    return PriorityResult(
        location=location,
        score=factors.total,
        rank=0,                     # set by rank_all_locations
        factors=factors,
        incident_ids=[i.id for i in incidents],
    )


def rank_all_locations(
    cop: CommonOperatingPicture,
    weights: dict[str, float] | None = None,
) -> list[PriorityResult]:
    """Score and rank every location that has at least one active incident."""
    locations = {i.location for i in cop.incidents if i.location}
    # Also include any location with a road closure
    for c in cop.road_closures:
        if c.location:
            locations.add(c.location)

    results = [score_location(loc, cop, weights) for loc in locations]
    results.sort(key=lambda r: r.score, reverse=True)
    for i, r in enumerate(results):
        r.rank = i + 1
    return results


# ── Factor calculators ────────────────────────────────────────────────────────

def _severity_factor(incidents: list[IncidentSnapshot]) -> float:
    if not incidents:
        return 0.0
    return max(_SEVERITY_SCORES.get(i.severity_label, 0.0) for i in incidents)


def _population_factor(incidents: list[IncidentSnapshot]) -> float:
    base = 0.0
    for inc in incidents:
        # People count contribution (capped at 50 pts)
        if inc.people_count:
            base = max(base, min(inc.people_count * 2.0, 50.0))
        # Facility type bonus
        ftype = (inc.facility or "").lower()
        for key, bonus in _FACILITY_POP_BONUS.items():
            if key in ftype:
                base = max(base, bonus + base * 0.5)
                break
    return min(base, 100.0)


def _accessibility_factor(
    location: str,
    closures: list[RoadClosureSnapshot],
    routes: list,
) -> float:
    """Higher score = LESS accessible = higher urgency."""
    score = 0.0
    # Each closure near this location adds urgency
    for c in closures:
        if c.location == location:
            score += 40.0
    # Delayed/blocked routes add urgency
    for r in routes:
        if r.destination == location:
            if r.status == "Blocked":
                score += 50.0
            elif r.status == "Rerouted":
                score += 20.0 + min(r.delay_minutes, 30.0)
    return min(score, 100.0)


def _weather_factor(alert_level: str) -> float:
    return _WEATHER_SCORES.get(alert_level, 0.0)


def _resource_factor(location: str, resources: list[ResourceSnapshot]) -> float:
    """Higher score = fewer available resources nearby = higher urgency."""
    available = [r for r in resources if r.status == "Available"]
    nearby    = [r for r in available if r.location == location]
    if not available:
        return 100.0
    # Fewer nearby available resources → higher urgency
    ratio = 1.0 - (len(nearby) / max(len(available), 1))
    return round(ratio * 100.0, 1)
