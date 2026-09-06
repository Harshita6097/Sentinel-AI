"""Graph abstraction over Kerala road network.

Designed as a drop-in interface for future NetworkX / OSMnx replacement:
swap _build_nx_graph() and the shortest-path call in route_planner.py
without touching any other module.
"""
import json
import os
from dataclasses import dataclass, field

_ROADS_PATH = os.path.join(os.path.dirname(__file__), "..", "simulation", "roads.json")


@dataclass
class Edge:
    id: str
    from_node: str
    to_node: str
    travel_time: float          # minutes (base weight)
    road_name: str
    blocked: bool = False
    penalty: float = 0.0        # extra minutes added by closures

    @property
    def effective_weight(self) -> float:
        if self.blocked:
            return float("inf")
        return self.travel_time + self.penalty


@dataclass
class RoadGraph:
    """Undirected weighted graph of Kerala road nodes and edges."""
    nodes: dict[str, dict]                          = field(default_factory=dict)
    edges: dict[str, Edge]                          = field(default_factory=dict)
    # adjacency: node → list of (neighbour, edge_id)
    adj: dict[str, list[tuple[str, str]]]           = field(default_factory=dict)

    def add_node(self, node_id: str, lat: float, lng: float) -> None:
        self.nodes[node_id] = {"lat": lat, "lng": lng}
        self.adj.setdefault(node_id, [])

    def add_edge(self, edge: Edge) -> None:
        self.edges[edge.id] = edge
        self.adj.setdefault(edge.from_node, []).append((edge.to_node, edge.id))
        self.adj.setdefault(edge.to_node,   []).append((edge.from_node, edge.id))

    def get_edge_between(self, a: str, b: str) -> Edge | None:
        for neighbour, eid in self.adj.get(a, []):
            if neighbour == b:
                return self.edges[eid]
        return None

    def neighbours(self, node: str) -> list[tuple[str, float, str]]:
        """Return [(neighbour, effective_weight, edge_id), ...]."""
        result = []
        for neighbour, eid in self.adj.get(node, []):
            edge = self.edges[eid]
            result.append((neighbour, edge.effective_weight, eid))
        return result


def load_graph() -> RoadGraph:
    """Load roads.json and return a fully constructed RoadGraph."""
    with open(_ROADS_PATH, encoding="utf-8") as f:
        data = json.load(f)

    graph = RoadGraph()
    for n in data["nodes"]:
        graph.add_node(n["id"], n["lat"], n["lng"])
    for e in data["edges"]:
        graph.add_edge(Edge(
            id=e["id"],
            from_node=e["from"],
            to_node=e["to"],
            travel_time=e["travel_time"],
            road_name=e["road_name"],
        ))
    return graph
