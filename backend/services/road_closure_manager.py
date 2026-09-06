"""Road closure manager.

Translates simulation events into graph edge mutations.
Blocked edges get effective_weight=inf so the route planner avoids them.
"""
from dataclasses import dataclass, field

from services.graph_builder import RoadGraph

# Simulation event locations → edge IDs they block
# Derived from timeline.json road_blocked events
_LOCATION_TO_EDGES: dict[str, list[str]] = {
    "Alappuzha": ["R3"],          # NH-66 near Alappuzha (event id 3)
    "Kottayam":  ["R6"],          # Kottayam–Ernakulam highway (event id 9)
}


@dataclass
class ClosureRecord:
    edge_id: str
    road_name: str
    reason: str
    event_id: int


class RoadClosureManager:
    def __init__(self, graph: RoadGraph) -> None:
        self._graph = graph
        self._closures: dict[str, ClosureRecord] = {}   # edge_id → record

    # ── public API ───────────────────────────────────────────────────────────

    def apply_event(self, event_type: str, location: str, event_id: int) -> list[str]:
        """Block edges triggered by a simulation event. Returns list of newly blocked edge IDs."""
        if event_type != "road_blocked":
            return []
        edge_ids = _LOCATION_TO_EDGES.get(location, [])
        blocked = []
        for eid in edge_ids:
            if eid not in self._closures and eid in self._graph.edges:
                edge = self._graph.edges[eid]
                edge.blocked = True
                self._closures[eid] = ClosureRecord(
                    edge_id=eid,
                    road_name=edge.road_name,
                    reason=f"Blocked by simulation event at {location}",
                    event_id=event_id,
                )
                blocked.append(eid)
        return blocked

    def clear_closure(self, edge_id: str) -> bool:
        """Unblock a road. Returns True if it was blocked."""
        if edge_id in self._closures:
            self._graph.edges[edge_id].blocked = False
            del self._closures[edge_id]
            return True
        return False

    def reset(self) -> None:
        """Remove all closures (used on simulation reset)."""
        for eid in list(self._closures):
            self.clear_closure(eid)

    def list_closures(self) -> list[ClosureRecord]:
        return list(self._closures.values())

    def is_blocked(self, edge_id: str) -> bool:
        return edge_id in self._closures
