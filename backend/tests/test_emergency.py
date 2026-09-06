"""Tests for Emergency Intelligence Agent and incident API."""
import pytest


def test_submit_report_basic(client):
    r = client.post("/api/emergency/report", json={"text": "Flooding in Alappuzha. 50 people trapped."})
    assert r.status_code in (200, 201)
    data = r.json()
    assert data["id"].startswith("INC-")
    assert data["location"] == "Alappuzha"
    assert data["incident_type"] in ("flood", "rescue")
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
    r = client.post("/api/emergency/report", json={"text": ""})
    assert r.status_code == 422


def test_list_incidents(client):
    client.post("/api/emergency/report", json={"text": "Flood in Kochi. Help needed."})
    r = client.get("/api/emergency/incidents")
    assert r.status_code == 200
    incidents = r.json()
    assert len(incidents) >= 1


def test_list_incidents_severity_filter(client):
    client.post("/api/emergency/report", json={"text": "Minor waterlogging in Thrissur."})
    r = client.get("/api/emergency/incidents?severity=Critical")
    assert r.status_code == 200
    for inc in r.json():
        assert inc["severity_label"] == "Critical"


def test_get_incident_by_id(client):
    r = client.post("/api/emergency/report", json={"text": "SOS from Pathanamthitta. People trapped."})
    inc_id = r.json()["id"]
    r2 = client.get(f"/api/emergency/incidents/{inc_id}")
    assert r2.status_code == 200
    assert r2.json()["id"] == inc_id


def test_get_incident_not_found(client):
    r = client.get("/api/emergency/incidents/INC-999")
    assert r.status_code == 404


def test_update_incident_status(client):
    r = client.post("/api/emergency/report", json={"text": "Flood in Ernakulam."})
    inc_id = r.json()["id"]
    r2 = client.patch(f"/api/emergency/incidents/{inc_id}/status", json={"status": "Acknowledged"})
    assert r2.status_code == 200
    assert r2.json()["status"] == "Acknowledged"


def test_duplicate_detection(client):
    text = "Flooding in Alappuzha. 30 people stranded."
    client.post("/api/emergency/report", json={"text": text})
    r2 = client.post("/api/emergency/report", json={"text": text})
    data = r2.json()
    assert data["duplicate"] is True


def test_mock_reports(client):
    r = client.post("/api/emergency/mock")
    assert r.status_code in (200, 201)
    data = r.json()
    # API returns list of incidents or a dict with 'loaded' key
    if isinstance(data, list):
        assert len(data) > 0
    else:
        assert data.get("loaded", 0) > 0
