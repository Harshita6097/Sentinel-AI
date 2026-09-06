"""
Emergency Intelligence Agent — orchestrates the full incident processing pipeline.

Pipeline:
  1. Parse & normalise raw text
  2. Extract entities (location, facility, incident type, people count)
  3. Classify severity (label + score + signals)
  4. Detect duplicates against existing incidents
  5. Calculate confidence scores
  6. Build and store structured Incident
  7. Return Incident for API response

Future integration points:
  - Step 2 → transformer NER model
  - Step 3 → fine-tuned severity classifier
  - Step 4 → ChromaDB vector similarity
  - Step 6 → LangGraph Commander agent
"""
from datetime import datetime

from services.text_parser import parse
from services.entity_extractor import extract, ExtractedEntities
from services.severity_classifier import classify, SeverityResult
from services.duplicate_detector import check as check_duplicate
from services import incident_store
from services.incident_store import Incident


def _confidence(
    entities: ExtractedEntities,
    severity: SeverityResult,
    duplicate_similarity: float,
) -> dict:
    """
    Calculate per-component and overall confidence scores.

    Extraction confidence degrades when key fields are missing.
    Severity confidence reflects how many signals were found.
    Duplicate confidence is inverse of similarity (high similarity = low confidence it's new).
    """
    # Extraction: penalise for each missing key field
    ext = 95
    if not entities.location:
        ext -= 20
    if not entities.facility:
        ext -= 10
    if entities.incident_type == "unknown":
        ext -= 15
    if not entities.people_count:
        ext -= 5
    ext = max(ext, 40)

    # Severity: more signals → higher confidence
    sev = min(60 + len(severity.signals) * 5, 98)

    # Duplicate: high similarity means we're less confident it's truly new
    dup = round((1 - duplicate_similarity) * 100)
    dup = max(dup, 30)

    overall = round(ext * 0.45 + sev * 0.35 + dup * 0.20)

    return {
        "extraction": ext,
        "severity": sev,
        "duplicate": dup,
        "overall": min(overall, 99),
    }


class EmergencyAgent:
    """
    Stateless emergency intelligence agent.

    Instantiate once at app startup; call .process() per report.
    """

    def process(self, raw_text: str, source: str = "manual") -> Incident:
        """
        Process a raw emergency report through the full pipeline.

        Args:
            raw_text: Unprocessed report string.
            source:   Origin channel (manual | mock | api).

        Returns:
            Stored Incident with all structured fields populated.

        Raises:
            ValueError: If the report text is empty or invalid.
        """
        timestamp = datetime.now()

        # 1. Parse
        normalized = parse(raw_text)

        # 2. Extract entities
        entities: ExtractedEntities = extract(normalized)

        # 3. Classify severity
        severity: SeverityResult = classify(normalized, entities)

        # 4. Detect duplicates (semantic when model available, keyword fallback)
        existing = incident_store.all_as_dicts()
        dup_result = check_duplicate(
            location=entities.location,
            incident_type=entities.incident_type,
            facility=entities.facility,
            timestamp=timestamp,
            existing_incidents=existing,
            raw_text=normalized,
        )

        # 5. Confidence
        confidence = _confidence(entities, severity, dup_result.similarity)

        # 6. Build incident
        incident = Incident(
            id=incident_store.make_id(),
            time=timestamp.strftime("%H:%M"),
            timestamp=timestamp,
            raw_text=raw_text,
            normalized_text=normalized,
            location=entities.location,
            facility=entities.facility,
            facility_type=entities.facility_type,
            incident_type=entities.incident_type,
            people_count=entities.people_count,
            urgency_keywords=entities.urgency_keywords,
            severity_label=severity.label,
            severity_score=severity.score,
            severity_signals=severity.signals,
            duplicate=dup_result.duplicate,
            duplicate_similarity=dup_result.similarity,
            matched_incident_id=dup_result.matched_id,
            confidence=confidence,
            source=source,
        )

        # 7. Store and return
        return incident_store.save(incident)


# Module-level singleton
emergency_agent = EmergencyAgent()
