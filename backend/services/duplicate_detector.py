"""Duplicate Detector — prevents repeated reports from creating multiple incidents.

Uses SentenceTransformer semantic similarity when available (USE_MOCK_MODELS=false),
otherwise falls back to lightweight keyword-based scoring.
"""
import logging
from dataclasses import dataclass
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

DUPLICATE_WINDOW_MINUTES = 30
DUPLICATE_THRESHOLD = 0.75
SEMANTIC_THRESHOLD = 0.82


@dataclass
class DuplicateResult:
    duplicate: bool
    similarity: float
    matched_id: str | None


def check(
    location: str | None,
    incident_type: str,
    facility: str | None,
    timestamp: datetime,
    existing_incidents: list[dict],
    raw_text: str = "",
) -> DuplicateResult:
    """Check whether a new report duplicates an existing incident."""
    if not existing_incidents:
        return DuplicateResult(duplicate=False, similarity=0.0, matched_id=None)

    if raw_text:
        result = _semantic_check(raw_text, timestamp, existing_incidents)
        if result is not None:
            return result

    return _keyword_check(location, incident_type, facility, timestamp, existing_incidents)


def _semantic_check(
    raw_text: str,
    timestamp: datetime,
    existing_incidents: list[dict],
) -> DuplicateResult | None:
    try:
        from services.model_loader import load_sentence_transformer
        model = load_sentence_transformer()
        if model is None:
            return None

        import numpy as np

        window = timedelta(minutes=DUPLICATE_WINDOW_MINUTES)
        candidates = [
            inc for inc in existing_incidents
            if inc.get("timestamp") and
            abs((timestamp - inc["timestamp"]).total_seconds()) <= window.total_seconds()
        ]
        if not candidates:
            return None

        texts = [inc.get("raw_text", inc.get("normalized_text", "")) for inc in candidates]
        texts = [t for t in texts if t]
        if not texts:
            return None

        embeddings = model.encode([raw_text] + texts, convert_to_numpy=True, show_progress_bar=False)
        query_emb = embeddings[0]
        candidate_embs = embeddings[1:]

        norms = np.linalg.norm(candidate_embs, axis=1, keepdims=True)
        norms = np.where(norms == 0, 1e-9, norms)
        similarities = (candidate_embs / norms) @ (query_emb / (np.linalg.norm(query_emb) + 1e-9))

        best_idx = int(np.argmax(similarities))
        best_score = float(similarities[best_idx])
        is_dup = best_score >= SEMANTIC_THRESHOLD

        return DuplicateResult(
            duplicate=is_dup,
            similarity=round(best_score, 3),
            matched_id=candidates[best_idx]["id"] if is_dup else None,
        )
    except Exception as exc:
        logger.debug("Semantic duplicate check failed (%s) — using keyword fallback", exc)
        return None


def _keyword_check(
    location: str | None,
    incident_type: str,
    facility: str | None,
    timestamp: datetime,
    existing_incidents: list[dict],
) -> DuplicateResult:
    best_score = 0.0
    best_id: str | None = None
    window = timedelta(minutes=DUPLICATE_WINDOW_MINUTES)

    for inc in existing_incidents:
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


def _similarity(location, incident_type, facility, existing) -> float:
    score = 0.0
    if location and existing.get("location"):
        if location.lower() == existing["location"].lower():
            score += 0.40
    if incident_type == existing.get("incident_type", ""):
        score += 0.35
    if facility and existing.get("facility"):
        f1, f2 = facility.lower(), existing["facility"].lower()
        if f1 == f2:
            score += 0.25
        elif f1 in f2 or f2 in f1:
            score += 0.12
    return score
