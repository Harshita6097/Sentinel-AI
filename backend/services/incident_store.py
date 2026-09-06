"""
Incident Store — in-memory database for structured incidents.

Architecture is designed for future persistence swap:
  - Replace _store with a SQLAlchemy session for PostgreSQL
  - Replace _store with a ChromaDB collection for vector search
  - The public interface (save, get, list, update_status) stays identical.
"""
from dataclasses import dataclass, field, asdict
from datetime import datetime
from typing import Literal

StatusType = Literal["Open", "Acknowledged", "Resolved"]


@dataclass
class Incident:
    id: str
    time: str                       # "HH:MM" display time
    timestamp: datetime
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
    confidence: dict                 # {extraction, severity, duplicate, overall}
    status: StatusType = "Open"
    source: str = "manual"          # manual | mock | api

    def to_dict(self) -> dict:
        d = asdict(self)
        d["timestamp"] = self.timestamp.isoformat()
        return d


# ── In-memory store ───────────────────────────────────────────────────────────
_store: list[Incident] = []
_counter = 0


def _next_id() -> str:
    global _counter
    _counter += 1
    return f"INC-{_counter:03d}"


def save(incident: Incident) -> Incident:
    """Persist a new incident. Returns the saved incident."""
    _store.insert(0, incident)   # newest first
    return incident


def get(incident_id: str) -> Incident | None:
    """Retrieve a single incident by ID."""
    return next((i for i in _store if i.id == incident_id), None)


def list_all(
    severity: str | None = None,
    status: str | None = None,
    limit: int = 100,
) -> list[Incident]:
    """
    Return incidents filtered by optional severity and status.

    Args:
        severity: Filter by severity label (Critical/High/Medium/Low).
        status:   Filter by status (Open/Acknowledged/Resolved).
        limit:    Maximum number of results.
    """
    results = _store
    if severity:
        results = [i for i in results if i.severity_label == severity]
    if status:
        results = [i for i in results if i.status == status]
    return results[:limit]


def update_status(incident_id: str, status: StatusType) -> Incident | None:
    """Update the status of an existing incident."""
    inc = get(incident_id)
    if inc:
        inc.status = status
    return inc


def all_as_dicts() -> list[dict]:
    """Return all incidents as plain dicts (for duplicate detection)."""
    return [
        {
            "id": i.id,
            "location": i.location,
            "incident_type": i.incident_type,
            "facility": i.facility,
            "timestamp": i.timestamp,
        }
        for i in _store
    ]


def make_id() -> str:
    """Generate the next sequential incident ID."""
    return _next_id()


def clear() -> None:
    """Clear all incidents and reset counter (used for testing / reset).

    WARNING: Only call this when the store is truly empty or being fully replaced.
    Calling clear() while incidents still exist elsewhere will cause ID collisions.
    """
    global _store, _counter
    _store = []
    _counter = 0
