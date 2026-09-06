"""Tests for Emergency Intelligence Agent and incident API."""


def test_submit_report_basic(client):
    r = client.post("/api/emergency/report", json={"text": "Flooding in Alappuzha. 50 people trapped."})
    assert r.status_code in (200, 201)
    data = r.json()
    assert data["id"].startswith("INC-")
    assert data["location"] == "Alappuzha"
    assert data["people_count"] == 50


def test_submit_report_hospital(client):
    r = client.post("/api/emergency/report", json={
        "text": "Kottayam District Hospital ICU flooding. 120 patients need evacuation. URGENT."
    })
    assert r.status_code in (200, 201)
    data = r.json()
    assert data["severity_label"] in ("Critical", "High")
    assert data["location"] == "Kottayam"
    assert data["people_count"] == 120


def test_submit_report_empty(client):
    assert client.post("/api/emergency/report", json={"text": ""}).status_code == 422


def test_list_incidents(client):
    client.post("/api/emergency/report", json={"text": "Flood in Kochi. Help needed."})
    assert len(client.get("/api/emergency/incidents").json()) >= 1


def test_list_incidents_severity_filter(client):
    client.post("/api/emergency/report", json={"text": "Minor waterlogging in Thrissur."})
    for inc in client.get("/api/emergency/incidents?severity=Critical").json():
        assert inc["severity_label"] == "Critical"


def test_get_incident_by_id(client):
    inc_id = client.post("/api/emergency/report", json={"text": "SOS from Pathanamthitta."}).json()["id"]
    assert client.get(f"/api/emergency/incidents/{inc_id}").json()["id"] == inc_id


def test_get_incident_not_found(client):
    assert client.get("/api/emergency/incidents/INC-999").status_code == 404


def test_update_incident_status(client):
    inc_id = client.post("/api/emergency/report", json={"text": "Flood in Ernakulam."}).json()["id"]
    r = client.patch(f"/api/emergency/incidents/{inc_id}/status", json={"status": "Acknowledged"})
    assert r.json()["status"] == "Acknowledged"


def test_duplicate_detection(client):
    text = "Flooding in Alappuzha. 30 people stranded."
    client.post("/api/emergency/report", json={"text": text})
    assert client.post("/api/emergency/report", json={"text": text}).json()["duplicate"] is True


def test_mock_reports(client):
    r = client.post("/api/emergency/mock")
    assert r.status_code in (200, 201)
    data = r.json()
    if isinstance(data, list):
        assert len(data) > 0
    else:
        assert data.get("loaded", 0) > 0
