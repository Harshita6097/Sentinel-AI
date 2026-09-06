"""Tests for Vision Agent and Dashboard API."""
import io
import pytest


def _make_jpeg_bytes() -> bytes:
    """Create a minimal valid JPEG for testing."""
    try:
        from PIL import Image
        buf = io.BytesIO()
        img = Image.new("RGB", (64, 64), color=(100, 150, 200))
        img.save(buf, format="JPEG")
        return buf.getvalue()
    except ImportError:
        # Minimal JPEG header if Pillow not available
        return (
            b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x00\x00\x01\x00\x01\x00\x00"
            b"\xff\xdb\x00C\x00\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\t\t"
            b"\x08\n\x0c\x14\r\x0c\x0b\x0b\x0c\x19\x12\x13\x0f\x14\x1d\x1a"
            b"\x1f\x1e\x1d\x1a\x1c\x1c $.' \",#\x1c\x1c(7),01444\x1f'9=82<.342\x1e"
            b"\xff\xc0\x00\x0b\x08\x00\x01\x00\x01\x01\x01\x11\x00\xff\xc4\x00"
            b"\x1f\x00\x00\x01\x05\x01\x01\x01\x01\x01\x01\x00\x00\x00\x00\x00"
            b"\x00\x00\x00\x01\x02\x03\x04\x05\x06\x07\x08\t\n\x0b\xff\xda\x00"
            b"\x08\x01\x01\x00\x00?\x00\xfb\xff\xd9"
        )


def test_vision_health(client):
    r = client.get("/api/vision/health")
    assert r.status_code == 200
    data = r.json()
    assert "mock_mode" in data


def test_vision_analyze_mock(client):
    jpeg = _make_jpeg_bytes()
    r = client.post(
        "/api/vision/analyze",
        files={"file": ("test.jpg", jpeg, "image/jpeg")},
    )
    assert r.status_code == 200
    data = r.json()
    assert "analysis" in data
    assert "scene_description" in data
    assert "confidence" in data
    assert data["analysis"]["model_used"] == "mock-segformer-v0"


def test_vision_analyze_invalid_type(client):
    r = client.post(
        "/api/vision/analyze",
        files={"file": ("test.txt", b"hello world", "text/plain")},
    )
    assert r.status_code == 422


def test_vision_analyze_empty_file(client):
    r = client.post(
        "/api/vision/analyze",
        files={"file": ("empty.jpg", b"", "image/jpeg")},
    )
    assert r.status_code == 422


# ── Dashboard API tests ───────────────────────────────────────────────────────

def test_dashboard_state(client):
    r = client.get("/api/dashboard/state")
    assert r.status_code == 200
    data = r.json()
    assert "sim" in data
    assert "cop" in data
    assert "resources" in data
    assert "network" in data
    assert len(data["resources"]) == 10


def test_dashboard_events(client):
    r = client.get("/api/dashboard/events")
    assert r.status_code == 200
    events = r.json()
    assert isinstance(events, list)


def test_dashboard_events_after_incident(client):
    client.post("/api/emergency/report", json={"text": "Flood in Kochi. Help needed."})
    r = client.get("/api/dashboard/events")
    events = r.json()
    sources = [e["source"] for e in events]
    assert "emergency" in sources


def test_dashboard_alerts_empty(client):
    r = client.get("/api/dashboard/alerts")
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_dashboard_alerts_with_critical_incident(client):
    client.post("/api/emergency/report", json={
        "text": "Critical SOS. Hospital flooding. 200 patients trapped. Dying."
    })
    r = client.get("/api/dashboard/alerts")
    alerts = r.json()
    severities = [a["severity"] for a in alerts]
    assert any(s in ("critical", "high") for s in severities)
