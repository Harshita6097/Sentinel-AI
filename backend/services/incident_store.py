"""Incident Store — dual-layer storage: in-memory (fast) + ChromaDB (persistent).

In-memory list provides O(1) access for the API and agent pipeline.
ChromaDB provides persistence across restarts and semantic search.

The public interface is unchanged — all callers continue to work.
"""
from dataclasses import dataclass, field, asdict
from datetime import datetime
from typing import Literal

StatusType = Literal["Open", "Acknowledged", "Resolved"]


@dataclass
class Incident:
    id: str
    time: str
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
    confidence: dict
    status: StatusType = "Open"
    source: str = "manual"

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
    """Persist a new incident to memory and ChromaDB."""
    _store.insert(0, incident)
    try:
        from services.chroma_store import chroma_store
        chroma_store.upsert(incident)
    except Exception:
        pass
    return incident


def get(incident_id: str) -> Incident | None:
    return next((i for i in _store if i.id == incident_id), None)


def list_all(
    severity: str | None = None,
    status: str | None = None,
    limit: int = 100,
) -> list[Incident]:
    results = _store
    if severity:
        results = [i for i in results if i.severity_label == severity]
    if status:
        results = [i for i in results if i.status == status]
    return results[:limit]


def semantic_search(query: str, n: int = 5) -> list[dict]:
    """Search incidents by semantic similarity. Returns metadata dicts."""
    try:
        from services.chroma_store import chroma_store
        return chroma_store.semantic_search(query, n=n)
    except Exception:
        return []


def update_status(incident_id: str, status: StatusType) -> Incident | None:
    inc = get(incident_id)
    if inc:
        inc.status = status
        try:
            from services.chroma_store import chroma_store
            chroma_store.upsert(inc)
        except Exception:
            pass
    return inc


def all_as_dicts() -> list[dict]:
    """Return all incidents as plain dicts (for duplicate detection)."""
    return [
        {
            "id":            i.id,
            "location":      i.location,
            "incident_type": i.incident_type,
            "facility":      i.facility,
            "timestamp":     i.timestamp,
            "raw_text":      i.raw_text,
            "normalized_text": i.normalized_text,
        }
        for i in _store
    ]


def make_id() -> str:
    return _next_id()


def clear() -> None:
    """Clear all incidents and reset counter."""
    global _store, _counter
    _store = []
    _counter = 0
    try:
        from services.chroma_store import chroma_store
        chroma_store.clear()
    except Exception:
        pass
