"""Emergency Intelligence Agent API endpoints."""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, field_validator
from agents.emergency_agent import emergency_agent
from services import incident_store

router = APIRouter(prefix="/api/emergency", tags=["emergency"])

# ── Mock reports for demonstration ───────────────────────────────────────────
MOCK_REPORTS = [
    "URGENT: Flood water has entered City Hospital in Alappuzha. Around 120 patients need immediate evacuation. Generator fuel running out.",
    "Bridge near Kottayam has collapsed. Multiple vehicles stranded on both sides. Road completely blocked.",
    "Relief shelter in Kochi has reached full capacity. Over 200 people waiting outside in rain. Need additional tents urgently.",
    "Flash flood warning in Pathanamthitta district. 3 villages submerged. Residents trapped on rooftops. SOS.",
    "Landslide on NH-66 near Thrissur. Debris blocking highway. 2 trucks buried. Rescue teams needed immediately.",
    "Idukki reservoir overflow imminent. Downstream villages in Ernakulam being evacuated. Approximately 500 families affected.",
    "Elderly woman trapped in flooded house in Alappuzha. Water level rising. Needs immediate rescue.",
    "Kottarakkara relief camp running low on food and medicine. Around 350 people sheltering here.",
    "Children stranded at school in Wayanad due to flooding. Teachers requesting evacuation support. 80 students.",
    "Road to Thiruvananthapuram General Hospital blocked by floodwater. Ambulances cannot reach emergency cases.",
]


# ── Pydantic schemas ──────────────────────────────────────────────────────────

class ReportIn(BaseModel):
    text: str

    @field_validator("text")
    @classmethod
    def not_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Report text cannot be empty.")
        if len(v.strip()) < 10:
            raise ValueError("Report text is too short (minimum 10 characters).")
        return v.strip()


class ConfidenceOut(BaseModel):
    extraction: int
    severity: int
    duplicate: int
    overall: int


class IncidentOut(BaseModel):
    id: str
    time: str
    timestamp: str
    raw_text: str
    normalized_text: str
    location: str | None
    facility: str | None
    facility_type: str | None
    incident_type: str
    people_count: int | None
    urgency_keywords: list[str]
    severity_label: str
    severity_score: int
    severity_signals: list[str]
    duplicate: bool
    duplicate_similarity: float
    matched_incident_id: str | None
    confidence: ConfidenceOut
    status: str
    source: str


class StatusIn(BaseModel):
    status: str

    @field_validator("status")
    @classmethod
    def valid_status(cls, v: str) -> str:
        if v not in ("Open", "Acknowledged", "Resolved"):
            raise ValueError("Status must be Open, Acknowledged, or Resolved.")
        return v


# ── Helpers ───────────────────────────────────────────────────────────────────

def _to_out(inc) -> IncidentOut:
    d = inc.to_dict()
    return IncidentOut(**d)


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/report", response_model=IncidentOut, status_code=201)
def submit_report(body: ReportIn):
    """Process a raw emergency report through the full NLP pipeline."""
    try:
        incident = emergency_agent.process(body.text, source="manual")
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    return _to_out(incident)


@router.get("/incidents", response_model=list[IncidentOut])
def list_incidents(severity: str | None = None, status: str | None = None):
    """List all incidents, optionally filtered by severity or status."""
    return [_to_out(i) for i in incident_store.list_all(severity=severity, status=status)]


@router.get("/incidents/{incident_id}", response_model=IncidentOut)
def get_incident(incident_id: str):
    """Retrieve a single incident by ID."""
    inc = incident_store.get(incident_id)
    if not inc:
        raise HTTPException(status_code=404, detail=f"Incident {incident_id} not found.")
    return _to_out(inc)


@router.patch("/incidents/{incident_id}/status", response_model=IncidentOut)
def update_status(incident_id: str, body: StatusIn):
    """Update the status of an incident (Open → Acknowledged → Resolved)."""
    inc = incident_store.update_status(incident_id, body.status)
    if not inc:
        raise HTTPException(status_code=404, detail=f"Incident {incident_id} not found.")
    return _to_out(inc)


@router.post("/mock", response_model=list[IncidentOut])
def load_mock_reports():
    """
    Load all sample Kerala flood reports into the incident store.
    Clears existing incidents first to prevent duplicates on repeated calls.
    """
    incident_store.clear()
    results = []
    for text in MOCK_REPORTS:
        inc = emergency_agent.process(text, source="mock")
        results.append(_to_out(inc))
    return results
