"""Shortest-path routing over Kerala road network.

Primary path: OSMnx + NetworkX real road graph (when osmnx is installed).
Fallback path: Custom Dijkstra over the static RoadGraph from roads.json.

The public interface (find_route) is identical in both cases.
"""
import heapq
import logging
from dataclasses import dataclass

from services.graph_builder import RoadGraph

logger = logging.getLogger(__name__)


@dataclass
class RouteResult:
    origin: str
    destination: str
    route: list[str]
    edge_ids: list[str]
    total_time: float
    reachable: bool
    source: str = "static"      # "osm" | "static"


def find_route(graph: RoadGraph, origin: str, destination: str) -> RouteResult:
    """Return the shortest route avoiding blocked edges.

    Tries OSMnx first; falls back to Dijkstra on the static RoadGraph.
    """
    if origin == destination:
        return RouteResult(origin, destination, [origin], [], 0.0, True, "static")

    osm_result = _try_osm_route(origin, destination)
    if osm_result is not None:
        return osm_result

    return _static_route(graph, origin, destination)


def _try_osm_route(origin: str, destination: str) -> RouteResult | None:
    try:
        from services.osm_service import osm_shortest_path
        result = osm_shortest_path(origin, destination)
        if result is None:
            return None
        return RouteResult(
            origin=origin,
            destination=destination,
            route=result["route"],
            edge_ids=[],
            total_time=result["total_time_minutes"],
            reachable=result["reachable"],
            source="osm",
        )
    except Exception as exc:
        logger.debug("OSM route attempt failed: %s", exc)
        return None


def _static_route(graph: RoadGraph, origin: str, destination: str) -> RouteResult:
    if origin not in graph.nodes or destination not in graph.nodes:
        return _unreachable(origin, destination)

    dist, prev_node, prev_edge = _dijkstra(graph, origin)
    if dist[destination] == float("inf"):
        return _unreachable(origin, destination)

    route, edge_ids = _reconstruct(prev_node, prev_edge, origin, destination)
    return RouteResult(origin, destination, route, edge_ids, dist[destination], True, "static")


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


def _unreachable(origin, destination):
    return RouteResult(origin, destination, [], [], float("inf"), False, "static")
