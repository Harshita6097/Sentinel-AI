"""OSMnx GIS service — real Kerala road network.

Downloads the Kerala road network via OSMnx and caches it locally as a
GraphML file. On subsequent starts the cached file is loaded directly
(no network call required).

Falls back to the static roads.json graph if OSMnx is unavailable or
the download fails.

Cache location: datasets/osm/kerala_drive.graphml
"""
import logging
import os
from pathlib import Path

logger = logging.getLogger(__name__)

_OSM_CACHE = Path(__file__).parent.parent / "datasets" / "osm" / "kerala_drive.graphml"

# Kerala bounding box (south, west, north, east)
_KERALA_BBOX = (8.17, 74.85, 12.78, 77.60)

# Mapping from our node names to approximate lat/lng for nearest-node lookup
_LOCATION_COORDS: dict[str, tuple[float, float]] = {
    "Kochi":              (9.9312,  76.2673),
    "Alappuzha":          (9.4981,  76.3388),
    "Kottayam":           (9.5916,  76.5222),
    "Thiruvananthapuram": (8.5241,  76.9366),
    "Thrissur":           (10.5276, 76.2144),
    "Palakkad":           (10.7867, 76.6548),
    "Pathanamthitta":     (9.2648,  76.7870),
    "Idukki":             (9.9189,  77.1025),
    "Ernakulam":          (9.9816,  76.2999),
    "Cherthala":          (9.6860,  76.3390),
    "Changanacherry":     (9.4480,  76.5360),
    "Muvattupuzha":       (9.9850,  76.5790),
}

_nx_graph = None          # networkx MultiDiGraph
_node_map: dict[str, int] = {}   # location name → OSM node id


def get_osm_graph():
    """Return (nx_graph, node_map) or (None, {}) if unavailable."""
    global _nx_graph, _node_map
    if _nx_graph is not None:
        return _nx_graph, _node_map
    try:
        import osmnx as ox
        import networkx as nx

        if _OSM_CACHE.exists():
            logger.info("Loading cached OSM graph from %s", _OSM_CACHE)
            G = ox.load_graphml(_OSM_CACHE)
        else:
            logger.info("Downloading Kerala drive network from OSM (one-time)…")
            G = ox.graph_from_bbox(
                *_KERALA_BBOX,
                network_type="drive",
                simplify=True,
            )
            _OSM_CACHE.parent.mkdir(parents=True, exist_ok=True)
            ox.save_graphml(G, _OSM_CACHE)
            logger.info("OSM graph cached at %s", _OSM_CACHE)

        # Add travel_time attribute (seconds) based on length and speed
        G = ox.add_edge_speeds(G)
        G = ox.add_edge_travel_times(G)

        # Build location → nearest OSM node mapping
        nmap = {}
        for name, (lat, lng) in _LOCATION_COORDS.items():
            try:
                nid = ox.nearest_nodes(G, lng, lat)
                nmap[name] = nid
            except Exception:
                pass

        _nx_graph = G
        _node_map = nmap
        logger.info("OSM graph ready: %d nodes, %d edges, %d locations mapped",
                    G.number_of_nodes(), G.number_of_edges(), len(nmap))
        return _nx_graph, _node_map

    except Exception as exc:
        logger.warning("OSMnx unavailable (%s) — using static roads.json", exc)
        return None, {}


def osm_shortest_path(
    origin: str,
    destination: str,
    blocked_edge_ids: set[str] | None = None,
) -> dict | None:
    """Compute shortest path between two named Kerala locations using OSM graph.

    Args:
        origin:           Location name (must be in _LOCATION_COORDS).
        destination:      Location name.
        blocked_edge_ids: Set of edge IDs to treat as blocked (ignored for OSM paths).

    Returns:
        dict with keys: route (list[str]), total_time_minutes (float), reachable (bool)
        or None if OSMnx is unavailable.
    """
    G, node_map = get_osm_graph()
    if G is None:
        return None
    if origin not in node_map or destination not in node_map:
        return None

    try:
        import networkx as nx

        src = node_map[origin]
        dst = node_map[destination]

        path_nodes = nx.shortest_path(G, src, dst, weight="travel_time")
        total_time_s = nx.shortest_path_length(G, src, dst, weight="travel_time")

        # Map OSM node IDs back to location names where possible
        reverse_map = {v: k for k, v in node_map.items()}
        named_route = []
        for nid in path_nodes:
            if nid in reverse_map:
                named_route.append(reverse_map[nid])

        # Ensure origin and destination are always in the route
        if not named_route or named_route[0] != origin:
            named_route.insert(0, origin)
        if named_route[-1] != destination:
            named_route.append(destination)

        return {
            "route": named_route,
            "total_time_minutes": round(total_time_s / 60, 1),
            "reachable": True,
        }
    except Exception as exc:
        logger.debug("OSM path failed %s→%s: %s", origin, destination, exc)
        return {"route": [], "total_time_minutes": float("inf"), "reachable": False}


def location_coords() -> dict[str, tuple[float, float]]:
    """Return the lat/lng coordinate map for all known locations."""
    return dict(_LOCATION_COORDS)
