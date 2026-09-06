"""
Duplicate Detector — prevents repeated reports from creating multiple incidents.

Uses a lightweight similarity score based on:
  - Location match (exact)
  - Incident type match
  - Facility overlap
  - Time proximity (within a configurable window)

Interface is ready for future replacement with vector similarity search (ChromaDB).
"""
from dataclasses import dataclass
from datetime import datetime, timedelta

DUPLICATE_WINDOW_MINUTES = 30   # reports within this window are candidates
DUPLICATE_THRESHOLD = 0.75      # similarity >= this → duplicate


@dataclass
class DuplicateResult:
    duplicate: bool
    similarity: float           # 0.0 – 1.0
    matched_id: str | None      # ID of the existing incident if duplicate


def check(
    location: str | None,
    incident_type: str,
    facility: str | None,
    timestamp: datetime,
    existing_incidents: list[dict],
) -> DuplicateResult:
    """
    Check whether a new report duplicates an existing incident.

    Args:
        location:           Extracted location string (may be None).
        incident_type:      Classified incident type string.
        facility:           Extracted facility name (may be None).
        timestamp:          Datetime of the new report.
        existing_incidents: List of stored incident dicts from incident_store.

    Returns:
        DuplicateResult with similarity score and matched ID if duplicate.
    """
    best_score = 0.0
    best_id: str | None = None
    window = timedelta(minutes=DUPLICATE_WINDOW_MINUTES)

    for inc in existing_incidents:
        # Only compare against open incidents within the time window
        inc_time = inc.get("timestamp")
        if inc_time and abs((timestamp - inc_time).total_seconds()) > window.total_seconds():
            continue

        score = _similarity(location, incident_type, facility, inc)
        if score > best_score:
            best_score = score
            best_id = inc["id"]

    is_dup = best_score >= DUPLICATE_THRESHOLD
    return DuplicateResult(
        duplicate=is_dup,
        similarity=round(best_score, 3),
        matched_id=best_id if is_dup else None,
    )


def _similarity(
    location: str | None,
    incident_type: str,
    facility: str | None,
    existing: dict,
) -> float:
    """
    Compute a weighted similarity score between a new report and an existing incident.

    Weights:
      - Location match:      0.40
      - Incident type match: 0.35
      - Facility match:      0.25
    """
    score = 0.0

    # Location (40%)
    if location and existing.get("location"):
        if location.lower() == existing["location"].lower():
            score += 0.40

    # Incident type (35%)
    if incident_type == existing.get("incident_type", ""):
        score += 0.35

    # Facility (25%) — partial match allowed
    if facility and existing.get("facility"):
        f1 = facility.lower()
        f2 = existing["facility"].lower()
        if f1 == f2:
            score += 0.25
        elif f1 in f2 or f2 in f1:
            score += 0.12

    return score
