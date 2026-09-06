"""
Severity Classifier — explainable rule-based severity scoring.

Each signal contributes a weighted score. The final label is derived
from the total score. All signals are logged for explainability.

Interface is ready for future replacement with a fine-tuned classifier.
"""
from dataclasses import dataclass, field
from services.entity_extractor import ExtractedEntities


@dataclass
class SeverityResult:
    label: str          # Critical | High | Medium | Low
    score: int          # 0–100 numeric score
    signals: list[str]  # human-readable explanation of what drove the score


# ── Scoring signals ───────────────────────────────────────────────────────────
# Each entry: (keyword_or_condition, points, explanation)
_TEXT_SIGNALS: list[tuple[str, int, str]] = [
    # Life-threatening
    ("trapped",          25, "People trapped"),
    ("casualt",          25, "Casualties reported"),
    ("dying",            25, "Life-threatening situation"),
    ("dead",             20, "Fatalities mentioned"),
    ("unconscious",      20, "Unconscious persons"),
    # Medical
    ("hospital",         15, "Medical facility involved"),
    ("patient",          15, "Patients at risk"),
    ("medical",          10, "Medical emergency"),
    # Vulnerable groups
    ("child",            15, "Children at risk"),
    ("children",         15, "Children at risk"),
    ("elderly",          12, "Elderly persons at risk"),
    ("pregnant",         15, "Pregnant persons at risk"),
    ("disabled",         12, "Disabled persons at risk"),
    # Flood severity
    ("rising water",     15, "Rising water level"),
    ("flash flood",      20, "Flash flood"),
    ("submerged",        12, "Area submerged"),
    ("inundated",        12, "Area inundated"),
    # Infrastructure
    ("bridge collapsed", 18, "Bridge collapse"),
    ("road blocked",     10, "Road access blocked"),
    ("power",            8,  "Power infrastructure affected"),
    # Urgency words
    ("urgent",           10, "Urgent keyword"),
    ("immediately",      10, "Immediate action required"),
    ("sos",              20, "SOS signal"),
    ("help",             8,  "Help requested"),
    ("emergency",        10, "Emergency declared"),
    # Shelter
    ("capacity",         8,  "Shelter at capacity"),
    ("overcrowded",      10, "Overcrowded facility"),
]

_INCIDENT_BONUS = {
    "medical":   15,
    "rescue":    20,
    "landslide": 18,
    "fire":      20,
    "flood":     10,
    "shelter":   5,
    "road":      5,
}

_PEOPLE_THRESHOLDS = [(200, 20, "200+ people affected"), (50, 12, "50+ people affected"), (10, 6, "10+ people affected")]


def classify(text: str, entities: ExtractedEntities) -> SeverityResult:
    """
    Classify severity of an emergency report.

    Args:
        text:     Normalised report text.
        entities: Extracted entities from entity_extractor.

    Returns:
        SeverityResult with label, numeric score, and signal explanations.
    """
    lower = text.lower()
    score = 0
    signals: list[str] = []

    # Text signal scoring
    seen: set[str] = set()
    for keyword, points, explanation in _TEXT_SIGNALS:
        if keyword in lower and explanation not in seen:
            score += points
            signals.append(explanation)
            seen.add(explanation)

    # Incident type bonus
    bonus = _INCIDENT_BONUS.get(entities.incident_type, 0)
    if bonus:
        score += bonus
        signals.append(f"Incident type: {entities.incident_type}")

    # People count bonus
    if entities.people_count:
        for threshold, pts, label in _PEOPLE_THRESHOLDS:
            if entities.people_count >= threshold:
                score += pts
                signals.append(label)
                break

    # Facility type bonus
    if entities.facility_type == "hospital":
        score += 10
        signals.append("Hospital facility")

    score = min(score, 100)

    label = (
        "Critical" if score >= 70 else
        "High"     if score >= 45 else
        "Medium"   if score >= 20 else
        "Low"
    )

    return SeverityResult(label=label, score=score, signals=signals or ["No high-severity signals detected"])
