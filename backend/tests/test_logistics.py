"""Tests for Logistics Agent, routing, and resource management."""


def test_get_resources(client):
    resources = client.get("/api/logistics/resources").json()
    assert len(resources) == 10
    types = {r["type"] for r in resources}
    assert {"Boat", "Ambulance", "Helicopter"}.issubset(types)


def test_get_network(client):
    net = client.get("/api/logistics/network").json()
    assert len(net["nodes"]) == 12
    assert len(net["edges"]) == 16


def test_assign_resource(client):
    # Boat-01 is at Alappuzha — assign to Kochi for a non-zero route
    r = client.post("/api/logistics/assign", json={"destination": "Kochi", "resource_type": "Boat"})
    assert r.status_code == 200
    data = r.json()
    assert data["destination"] == "Kochi"
    assert data["reachable"] is True
    assert data["eta_minutes"] >= 0


def test_assign_resource_no_type(client):
    r = client.post("/api/logistics/assign", json={"destination": "Kottayam"})
    assert r.status_code == 200
    assert r.json()["destination"] == "Kottayam"


def test_assign_resource_unknown_destination(client):
    assert client.post("/api/logistics/assign", json={"destination": "UnknownCity"}).status_code == 404


def test_get_routes_after_assign(client):
    client.post("/api/logistics/assign", json={"destination": "Thrissur"})
    routes = client.get("/api/logistics/routes").json()
    assert len(routes) >= 1
    assert routes[0]["destination"] == "Thrissur"


def test_road_closure_event(client):
    r = client.post("/api/logistics/event", json={"event_type": "road_blocked", "location": "Alappuzha", "event_id": 3})
    assert r.status_code == 200


def test_recalculate_routes(client):
    client.post("/api/logistics/assign", json={"destination": "Alappuzha"})
    assert client.post("/api/logistics/recalculate").status_code == 200


def test_logistics_reset(client):
    client.post("/api/logistics/assign", json={"destination": "Kochi"})
    client.post("/api/logistics/reset")
    assert len(client.get("/api/logistics/routes").json()) == 0


# ── Unit tests ────────────────────────────────────────────────────────────────

def test_dijkstra_basic():
    from services.graph_builder import load_graph
    from services.route_planner import find_route
    result = find_route(load_graph(), "Kochi", "Alappuzha")
    assert result.reachable is True
    assert result.route[0] == "Kochi"
    assert result.route[-1] == "Alappuzha"


def test_dijkstra_same_node():
    from services.graph_builder import load_graph
    from services.route_planner import find_route
    result = find_route(load_graph(), "Kochi", "Kochi")
    assert result.reachable is True
    assert result.total_time == 0.0


def test_dijkstra_blocked_edge():
    from services.graph_builder import load_graph
    from services.route_planner import find_route
    graph = load_graph()
    graph.edges["R3"].blocked = True
    result = find_route(graph, "Kochi", "Alappuzha")
    assert result.reachable is True
    assert "R3" not in result.edge_ids
