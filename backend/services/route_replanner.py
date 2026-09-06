"""Route replanner.

When road closures change, recomputes all active assignments that
used a now-blocked edge and generates a plain-English explanation.
"""
from dataclasses import dataclass

from services.graph_builder import RoadGraph
from services.route_planner import find_route, RouteResult
from services.eta_calculator import calculate_eta, ETAResult


@dataclass
class Assignment:
    assignment_id: str
    resource_id: str
    origin: str
    destination: str
    route: RouteResult
    eta: ETAResult
    status: str                 # "Active" | "Rerouted" | "Blocked"
    explanation: str


class RouteReplanner:
    def __init__(self, graph: RoadGraph) -> None:
        self._graph = graph
        self._assignments: dict[str, Assignment] = {}
        self._counter = 0

    # ── public API ───────────────────────────────────────────────────────────

    def create_assignment(
        self,
        resource_id: str,
        origin: str,
        destination: str,
        current_sim_minutes: int,
    ) -> Assignment:
        self._counter += 1
        aid = f"ASGN-{self._counter:03d}"
        route = find_route(self._graph, origin, destination)
        eta   = calculate_eta(self._graph, origin, destination, current_sim_minutes)
        status = "Active" if route.reachable else "Blocked"
        explanation = (
            f"Route assigned: {' -> '.join(route.route)}. ETA {eta.eta_minutes:.0f} min."
            if route.reachable
            else f"No passable route from {origin} to {destination}."
        )
        a = Assignment(aid, resource_id, origin, destination, route, eta, status, explanation)
        self._assignments[aid] = a
        return a

    def replan_all(self, newly_blocked_edge_ids: list[str], current_sim_minutes: int) -> list[Assignment]:
        """Recompute any assignment whose route used a newly blocked edge."""
        affected = []
        for a in self._assignments.values():
            if a.status == "Blocked":
                continue
            if not any(eid in a.route.edge_ids for eid in newly_blocked_edge_ids):
                continue

            old_route  = a.route
            new_route  = find_route(self._graph, a.origin, a.destination)
            new_eta    = calculate_eta(self._graph, a.origin, a.destination, current_sim_minutes)

            if new_route.reachable:
                blocked_names = [
                    self._graph.edges[eid].road_name
                    for eid in newly_blocked_edge_ids
                    if eid in old_route.edge_ids
                ]
                road_str = ", ".join(blocked_names) or "a road"
                delay_str = (
                    f" Alternative route adds {new_eta.delay_minutes:.0f} minutes."
                    if new_eta.delay_minutes > 0 else ""
                )
                a.explanation = (
                    f"Primary route became unavailable because {road_str} was blocked."
                    f"{delay_str}"
                )
                a.status = "Rerouted"
            else:
                a.explanation = (
                    f"All routes from {a.origin} to {a.destination} are currently blocked."
                )
                a.status = "Blocked"

            a.route = new_route
            a.eta   = new_eta
            affected.append(a)

        return affected

    def get_assignment(self, assignment_id: str) -> Assignment | None:
        return self._assignments.get(assignment_id)

    def list_assignments(self) -> list[Assignment]:
        return list(self._assignments.values())

    def remove_assignment(self, assignment_id: str) -> bool:
        return bool(self._assignments.pop(assignment_id, None))

    def reset(self) -> None:
        self._assignments.clear()
        self._counter = 0
