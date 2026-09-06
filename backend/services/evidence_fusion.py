"""Evidence Fusion Service.

Combines confidence scores from multiple agent sources into a single
fused confidence value with a full per-source breakdown.

Source weights reflect how reliable each agent's output is for
the Commander's decision-making:
  - Logistics: deterministic graph routing → highest weight
  - Emergency: NLP pipeline with known accuracy → high weight
  - Vision:    mock model, real model later → medium weight
  - Weather:   mock forecast → lower weight
"""
from dataclasses import dataclass

# Source reliability weights (must sum to 1.0)
SOURCE_WEIGHTS: dict[str, float] = {
    "logistics": 0.35,
    "emergency": 0.30,
    "vision":    0.20,
    "weather":   0.15,
}


@dataclass
class EvidenceSource:
    name: str
    confidence: int         # 0–100
    weight: float
    contribution: float     # weight * confidence


@dataclass
class FusedEvidence:
    fused_confidence: int               # 0–100 weighted average
    sources: list[EvidenceSource]
    dominant_source: str                # source with highest contribution
    evidence_count: int                 # number of sources with confidence > 0


def fuse(source_confidences: dict[str, int]) -> FusedEvidence:
    """
    Fuse per-source confidence scores into a single value.

    Args:
        source_confidences: dict mapping source name → confidence (0-100).
                            Missing sources default to 0.

    Returns:
        FusedEvidence with weighted average and full breakdown.
    """
    sources = []
    total_weight = 0.0
    weighted_sum = 0.0

    for name, weight in SOURCE_WEIGHTS.items():
        conf = source_confidences.get(name, 0)
        contribution = weight * conf
        sources.append(EvidenceSource(
            name=name,
            confidence=conf,
            weight=weight,
            contribution=round(contribution, 2),
        ))
        weighted_sum  += contribution
        total_weight  += weight

    fused = round(weighted_sum / total_weight) if total_weight > 0 else 0
    dominant = max(sources, key=lambda s: s.contribution)

    active = [s for s in sources if s.confidence > 0]

    return FusedEvidence(
        fused_confidence=min(fused, 99),
        sources=sources,
        dominant_source=dominant.name,
        evidence_count=len(active),
    )
