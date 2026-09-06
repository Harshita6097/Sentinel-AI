"""Shortest-path routing over RoadGraph.

Uses Dijkstra's algorithm directly on the graph abstraction.
To switch to NetworkX: replace _dijkstra() with nx.shortest_path()
and nx.shortest_path_length() — the public interface stays identical.
"""
import heapq
from dataclasses import dataclass

from services.graph_builder import RoadGraph


@dataclass
class RouteResult:
    origin: str
    destination: str
    route: list[str]            # ordered node sequence
    edge_ids: list[str]         # edges traversed
    total_time: float           # minutes
    reachable: bool


def find_route(graph: RoadGraph, origin: str, destination: str) -> RouteResult:
    """Return the shortest (lowest travel-time) route avoiding blocked edges."""
    if origin not in graph.nodes:
        return _unreachable(origin, destination, f"Origin '{origin}' not in graph")
    if destination not in graph.nodes:
        return _unreachable(origin, destination, f"Destination '{destination}' not in graph")
    if origin == destination:
        return RouteResult(origin, destination, [origin], [], 0.0, True)

    dist, prev_node, prev_edge = _dijkstra(graph, origin)

    if dist[destination] == float("inf"):
        return _unreachable(origin, destination, "No passable path")

    route, edge_ids = _reconstruct(prev_node, prev_edge, origin, destination)
    return RouteResult(origin, destination, route, edge_ids, dist[destination], True)


# ── internals ────────────────────────────────────────────────────────────────

def _dijkstra(graph: RoadGraph, source: str):
    dist      = {n: float("inf") for n in graph.nodes}
    prev_node = {n: None for n in graph.nodes}
    prev_edge = {n: None for n in graph.nodes}
    dist[source] = 0.0
    heap = [(0.0, source)]

    while heap:
        d, u = heapq.heappop(heap)
        if d > dist[u]:
            continue
        for v, w, eid in graph.neighbours(u):
            if w == float("inf"):
                continue
            nd = d + w
            if nd < dist[v]:
                dist[v]      = nd
                prev_node[v] = u
                prev_edge[v] = eid
                heapq.heappush(heap, (nd, v))

    return dist, prev_node, prev_edge


def _reconstruct(prev_node, prev_edge, origin, destination):
    route, edge_ids = [], []
    cur = destination
    while cur is not None:
        route.append(cur)
        if prev_edge[cur]:
            edge_ids.append(prev_edge[cur])
        cur = prev_node[cur]
    route.reverse()
    edge_ids.reverse()
    return route, edge_ids


def _unreachable(origin, destination, reason=""):
    return RouteResult(origin, destination, [], [], float("inf"), False)
