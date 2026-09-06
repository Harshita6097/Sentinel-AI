"""ETA calculator.

Converts route travel_time (minutes) into wall-clock arrival time
relative to the simulation clock, and computes delay vs. the
unobstructed baseline route.
"""
from dataclasses import dataclass

from services.graph_builder import RoadGraph
from services.route_planner import find_route


@dataclass
class ETAResult:
    eta_minutes: float          # total travel time on current (possibly rerouted) path
    baseline_minutes: float     # travel time on unobstructed direct path
    delay_minutes: float        # extra time caused by closures
    arrival_time: str           # HH:MM wall-clock arrival
    reachable: bool


def calculate_eta(
    graph: RoadGraph,
    origin: str,
    destination: str,
    current_sim_minutes: int,
) -> ETAResult:
    """Compute ETA from origin to destination given current graph state."""
    route = find_route(graph, origin, destination)

    # Baseline: temporarily unblock all edges to get the ideal travel time
    baseline = _baseline_time(graph, origin, destination)

    eta = route.total_time if route.reachable else float("inf")
    delay = max(eta - baseline, 0.0) if route.reachable else 0.0
    arrival = _to_time_str(current_sim_minutes + eta) if route.reachable else "--:--"

    return ETAResult(
        eta_minutes=round(eta, 1),
        baseline_minutes=round(baseline, 1),
        delay_minutes=round(delay, 1),
        arrival_time=arrival,
        reachable=route.reachable,
    )


# ── internals ────────────────────────────────────────────────────────────────

def _baseline_time(graph: RoadGraph, origin: str, destination: str) -> float:
    """Shortest path ignoring current blockages."""
    # Temporarily lift all blocks
    blocked_edges = {eid: e for eid, e in graph.edges.items() if e.blocked}
    for e in blocked_edges.values():
        e.blocked = False

    result = find_route(graph, origin, destination)
    baseline = result.total_time if result.reachable else float("inf")

    # Restore blocks
    for e in blocked_edges.values():
        e.blocked = True

    return baseline


def _to_time_str(total_minutes: float) -> str:
    if total_minutes == float("inf"):
        return "--:--"
    h, m = divmod(int(total_minutes), 60)
    return f"{h % 24:02d}:{m:02d}"
