"""Tests for health and simulation API endpoints."""


def test_health(client):
    r = client.get("/health")
    assert r.status_code == 200
    data = r.json()
    assert data["status"] == "ok"
    assert "version" in data


def test_health_detailed(client):
    r = client.get("/health/detailed")
    assert r.status_code == 200
    data = r.json()
    assert data["status"] == "ok"
    assert "services" in data


def test_simulation_state_initial(client):
    r = client.get("/api/simulation/state")
    assert r.status_code == 200
    data = r.json()
    assert data["paused"] is True
    assert data["time"] == "09:00"
    assert data["progress"] == 0.0


def test_simulation_play_pause(client):
    r = client.post("/api/simulation/play")
    assert r.status_code == 200
    assert r.json()["paused"] is False

    r = client.post("/api/simulation/pause")
    assert r.status_code == 200
    assert r.json()["paused"] is True


def test_simulation_step(client):
    r = client.post("/api/simulation/step")
    assert r.status_code == 200
    data = r.json()
    # After one step, time should advance by 1 minute
    assert data["current_minutes"] == 541


def test_simulation_speed(client):
    r = client.post("/api/simulation/speed", json={"speed": 2})
    assert r.status_code == 200
    assert r.json()["speed"] == 2


def test_simulation_speed_invalid(client):
    r = client.post("/api/simulation/speed", json={"speed": 99})
    assert r.status_code in (400, 422)


def test_simulation_reset(client):
    client.post("/api/simulation/step")
    r = client.post("/api/simulation/reset")
    assert r.status_code == 200
    state = client.get("/api/simulation/state").json()
    assert state["current_minutes"] == 540


def test_simulation_timeline(client):
    r = client.get("/api/simulation/timeline")
    assert r.status_code == 200
    events = r.json()
    assert len(events) == 16
    assert events[0]["time"] == "09:00"
