"""Tests for Commander Agent, COP, and priority engine."""


def test_cop_initial_state(client):
    cop = client.get("/api/commander/cop").json()
    assert cop["sim_time"] == "09:00"
    assert cop["weather"]["alert_level"] == "Green"


def test_recompute_returns_recommendations(client):
    client.post("/api/emergency/report", json={
        "text": "Critical flooding at Alappuzha Medical Center. 80 patients trapped. SOS."
    })
    data = client.post("/api/commander/recompute").json()
    assert len(data["recommendations"]) >= 1
    rec = data["recommendations"][0]
    assert all(k in rec for k in ("location", "priority_score", "confidence", "reason"))


def test_recommendations_have_evidence_sources(client):
    client.post("/api/emergency/report", json={"text": "Flood in Kottayam. Hospital at risk."})
    recs = client.post("/api/commander/recompute").json()["recommendations"]
    if recs:
        assert isinstance(recs[0]["evidence_sources"], list)


def test_decision_log_grows(client):
    client.post("/api/emergency/report", json={"text": "Flood in Thrissur. Urgent."})
    client.post("/api/commander/recompute")
    client.post("/api/commander/recompute")
    assert len(client.get("/api/commander/decision-log").json()) >= 2


def test_commander_reset(client):
    client.post("/api/emergency/report", json={"text": "Flood in Kochi."})
    client.post("/api/commander/recompute")
    client.post("/api/commander/reset")
    assert len(client.get("/api/commander/decision-log").json()) == 0


# ── Unit tests ────────────────────────────────────────────────────────────────

def test_priority_engine_scores_location():
    from services.cop_manager import CommonOperatingPicture, IncidentSnapshot, WeatherSnapshot
    from services.priority_engine import score_location
    cop = CommonOperatingPicture()
    cop.weather = WeatherSnapshot(alert_level="Red")
    cop.incidents = [IncidentSnapshot(
        id="INC-001", location="Alappuzha", incident_type="flood",
        severity_label="Critical", severity_score=90, people_count=100,
        status="Open", confidence=85,
    )]
    assert score_location("Alappuzha", cop).score > 50


def test_priority_engine_ranks_multiple():
    from services.cop_manager import CommonOperatingPicture, IncidentSnapshot, WeatherSnapshot
    from services.priority_engine import rank_all_locations
    cop = CommonOperatingPicture()
    cop.weather = WeatherSnapshot(alert_level="Orange")
    cop.incidents = [
        IncidentSnapshot(id="INC-001", location="Alappuzha", incident_type="flood",
                         severity_label="Critical", severity_score=90, people_count=200,
                         status="Open", confidence=90),
        IncidentSnapshot(id="INC-002", location="Kochi", incident_type="flood",
                         severity_label="Low", severity_score=20, people_count=5,
                         status="Open", confidence=60),
    ]
    ranked = rank_all_locations(cop)
    assert ranked[0].score >= ranked[1].score
    assert ranked[0].location == "Alappuzha"


def test_evidence_fusion_all_sources():
    from services.evidence_fusion import fuse
    result = fuse({"logistics": 100, "emergency": 90, "vision": 80, "weather": 70})
    assert 70 <= result.fused_confidence <= 99
    assert result.evidence_count == 4


def test_evidence_fusion_empty():
    from services.evidence_fusion import fuse
    result = fuse({})
    assert result.fused_confidence == 0
    assert result.evidence_count == 0
