"""
Entity Extractor — rule-based named entity recognition for emergency reports.

Extracts: location, facility, incident_type, people_count, urgency_keywords.
Interface is designed for future replacement with a transformer NER model
(e.g. spaCy, BERT-NER, or a fine-tuned disaster-domain model).
"""
import re
from dataclasses import dataclass, field

# ── Kerala location vocabulary ────────────────────────────────────────────────
_LOCATIONS = [
    "Alappuzha", "Kochi", "Ernakulam", "Thiruvananthapuram", "Trivandrum",
    "Kottayam", "Thrissur", "Palakkad", "Kozhikode", "Calicut",
    "Malappuram", "Kannur", "Kasaragod", "Pathanamthitta", "Idukki",
    "Wayanad", "Kollam", "Kottarakkara", "Munnar", "Alleppey",
]

# ── Facility type patterns ────────────────────────────────────────────────────
_FACILITY_PATTERNS = [
    (r'\b([\w\s]+(?:hospital|medical\s+cent(?:er|re)|clinic|health\s+cent(?:er|re)))\b', 'hospital'),
    (r'\b([\w\s]+(?:shelter|relief\s+camp|evacuation\s+cent(?:er|re)))\b', 'shelter'),
    (r'\b([\w\s]+(?:school|college|university))\b', 'school'),
    (r'\b([\w\s]+(?:bridge|road|highway|nh-?\d+))\b', 'infrastructure'),
    (r'\b([\w\s]+(?:depot|warehouse|supply\s+cent(?:er|re)))\b', 'resource'),
]

# ── Incident type keywords ────────────────────────────────────────────────────
_INCIDENT_KEYWORDS = {
    "flood":     ["flood", "flooding", "inundated", "submerged", "waterlogged", "overflow", "deluge"],
    "landslide": ["landslide", "mudslide", "rockfall", "debris", "collapse"],
    "fire":      ["fire", "blaze", "burning", "flames", "smoke"],
    "medical":   ["medical", "injured", "casualty", "casualties", "unconscious", "cardiac", "sos"],
    "rescue":    ["trapped", "stranded", "stuck", "rescue", "evacuation", "evacuate"],
    "shelter":   ["shelter", "capacity", "overcrowded", "full", "overflow"],
    "road":      ["road blocked", "road closed", "highway blocked", "bridge collapsed", "traffic"],
}

# ── Urgency signal words ──────────────────────────────────────────────────────
_URGENCY_WORDS = [
    "urgent", "immediately", "critical", "emergency", "help", "sos",
    "trapped", "dying", "dead", "casualties", "critical", "danger",
    "life-threatening", "mayday",
]


@dataclass
class ExtractedEntities:
    location: str | None
    facility: str | None
    facility_type: str | None
    incident_type: str
    people_count: int | None
    urgency_keywords: list[str] = field(default_factory=list)
    raw_matches: dict = field(default_factory=dict)


def extract(text: str) -> ExtractedEntities:
    """
    Extract structured entities from a normalised emergency report.

    Args:
        text: Cleaned report string from text_parser.

    Returns:
        ExtractedEntities with all identified fields.
    """
    lower = text.lower()

    location = _extract_location(text)
    facility, facility_type = _extract_facility(text)
    incident_type = _extract_incident_type(lower)
    people_count = _extract_people_count(text)
    urgency = _extract_urgency(lower)

    return ExtractedEntities(
        location=location,
        facility=facility,
        facility_type=facility_type,
        incident_type=incident_type,
        people_count=people_count,
        urgency_keywords=urgency,
        raw_matches={
            "location_source": location,
            "facility_source": facility,
        },
    )


def _extract_location(text: str) -> str | None:
    """Match known Kerala locations (case-insensitive)."""
    for loc in _LOCATIONS:
        if re.search(rf'\b{re.escape(loc)}\b', text, re.IGNORECASE):
            return loc
    return None


def _extract_facility(text: str) -> tuple[str | None, str | None]:
    """Extract facility name and type using regex patterns."""
    for pattern, ftype in _FACILITY_PATTERNS:
        m = re.search(pattern, text, re.IGNORECASE)
        if m:
            name = m.group(1).strip().title()
            # Trim trailing generic words to get a clean name
            name = re.sub(r'\s+(hospital|shelter|school|bridge|road)$', '', name, flags=re.IGNORECASE).strip()
            return name, ftype
    return None, None


def _extract_incident_type(lower: str) -> str:
    """Return the most prominent incident type based on keyword frequency."""
    scores: dict[str, int] = {}
    for itype, keywords in _INCIDENT_KEYWORDS.items():
        scores[itype] = sum(1 for kw in keywords if kw in lower)
    best = max(scores, key=lambda k: scores[k])
    return best if scores[best] > 0 else "unknown"


def _extract_people_count(text: str) -> int | None:
    """Extract numeric people count from patterns like '120 patients', 'around 50 people'."""
    patterns = [
        r'(\d+)\s*(?:people|persons?|patients?|residents?|civilians?|victims?|individuals?)',
        r'(?:around|approximately|about|nearly|over)\s+(\d+)',
        r'(\d+)\s*(?:families|households)',
    ]
    for p in patterns:
        m = re.search(p, text, re.IGNORECASE)
        if m:
            return int(m.group(1))
    return None


def _extract_urgency(lower: str) -> list[str]:
    """Return list of urgency signal words found in the text."""
    return [w for w in _URGENCY_WORDS if w in lower]
