"""Logistics Agent — orchestrates routing, closures, resources, and ETAs.

Pipeline per request:
  1. Build / reuse graph
  2. Apply any pending road closures
  3. Find best route
  4. Estimate ETA
  5. Assign nearest available resource
  6. Return assignment

Module-level singleton `logistics_agent` is imported by the API router.
"""
from dataclasses import dataclass

from services.graph_builder import load_graph, RoadGraph
from services.route_planner import find_route
from services.road_closure_manager import RoadClosureManager
from services.resource_manager import ResourceManager
from services.eta_calculator import calculate_eta
from services.route_replanner import RouteReplanner, Assignment


@dataclass
class AssignmentResponse:
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


class LogisticsAgent:
    def __init__(self) -> None:
        self._graph: RoadGraph = load_graph()
        self.closure_manager   = RoadClosureManager(self._graph)
        self.resource_manager  = ResourceManager()
        self.replanner         = RouteReplanner(self._graph)

    # ── main operations ──────────────────────────────────────────────────────

    def assign_resource(
        self,
        destination: str,
        resource_type: str | None = None,
        resource_id: str | None = None,
        current_sim_minutes: int = 540,
    ) -> AssignmentResponse | None:
        """Find best resource, compute route, create assignment."""
        if resource_id:
            resource = self.resource_manager.get(resource_id)
        else:
            resource = self.resource_manager.nearest_available(
                destination, resource_type, self._graph.nodes
            )

        if not resource:
            return None

        assignment = self.replanner.create_assignment(
            resource.id, resource.location, destination, current_sim_minutes
        )
        self.resource_manager.assign(resource.id, destination)
        return self._to_response(assignment, resource.type)

    def handle_simulation_event(
        self, event_type: str, location: str, event_id: int, current_sim_minutes: int
    ) -> list[Assignment]:
        """Apply event to graph and replan affected routes."""
        blocked = self.closure_manager.apply_event(event_type, location, event_id)
        if blocked:
            return self.replanner.replan_all(blocked, current_sim_minutes)
        return []

    def recalculate_all(self, current_sim_minutes: int) -> list[AssignmentResponse]:
        """Force-recompute every active assignment."""
        results = []
        for a in self.replanner.list_assignments():
            resource = self.resource_manager.get(a.resource_id)
            rtype = resource.type if resource else "Unknown"
            new_route = find_route(self._graph, a.origin, a.destination)
            new_eta   = calculate_eta(self._graph, a.origin, a.destination, current_sim_minutes)
            a.route = new_route
            a.eta   = new_eta
            a.status = "Active" if new_route.reachable else "Blocked"
            results.append(self._to_response(a, rtype))
        return results

    def reset(self) -> None:
        self.closure_manager.reset()
        self.resource_manager.reset()
        self.replanner.reset()
        # Reload graph to clear all edge mutations
        self._graph = load_graph()
        self.closure_manager  = RoadClosureManager(self._graph)
        self.replanner        = RouteReplanner(self._graph)

    # ── graph / closure accessors ────────────────────────────────────────────

    @property
    def graph(self) -> RoadGraph:
        return self._graph

    def get_road_network(self) -> dict:
        """Serialisable snapshot of nodes, edges, and current closure state."""
        return {
            "nodes": [
                {"id": nid, **coords}
                for nid, coords in self._graph.nodes.items()
            ],
            "edges": [
                {
                    "id": e.id,
                    "from": e.from_node,
                    "to": e.to_node,
                    "travel_time": e.travel_time,
                    "road_name": e.road_name,
                    "blocked": e.blocked,
                }
                for e in self._graph.edges.values()
            ],
        }

    # ── helpers ──────────────────────────────────────────────────────────────

    @staticmethod
    def _to_response(a: Assignment, resource_type: str) -> AssignmentResponse:
        return AssignmentResponse(
            assignment_id=a.assignment_id,
            resource_id=a.resource_id,
            resource_type=resource_type,
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
        )


# Module-level singleton
logistics_agent = LogisticsAgent()
