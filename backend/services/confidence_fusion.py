"""Confidence Fusion Service.

Produces the final Commander confidence score by combining:
  1. Evidence fusion confidence (from agent sources)
  2. Priority score certainty (how decisive the top score is vs. second)
  3. Data completeness (how many COP layers have data)

Returns a full breakdown so the UI can show per-component bars.
"""
from dataclasses import dataclass

from services.evidence_fusion import FusedEvidence
from services.priority_engine import PriorityResult


@dataclass
class ConfidenceBreakdown:
    evidence_confidence: int        # from evidence fusion
    priority_certainty: int         # gap between rank-1 and rank-2 scores
    data_completeness: int          # fraction of COP layers populated
    overall: int                    # weighted combination


def compute_confidence(
    fused: FusedEvidence,
    ranked: list[PriorityResult],
    cop_completeness: float,        # 0.0–1.0
) -> ConfidenceBreakdown:
    """
    Compute final Commander confidence.

    Args:
        fused:            Output of evidence_fusion.fuse().
        ranked:           Sorted list from priority_engine.rank_all_locations().
        cop_completeness: Fraction of COP data layers that have content (0–1).

    Returns:
        ConfidenceBreakdown with per-component scores and overall.
    """
    ev_conf = fused.fused_confidence

    # Priority certainty: how much rank-1 leads rank-2 (0–100)
    if len(ranked) >= 2:
        gap = ranked[0].score - ranked[1].score
        priority_cert = min(int(gap * 2), 100)   # 50-pt gap → 100% certainty
    elif len(ranked) == 1:
        priority_cert = 70                        # only one zone, moderate certainty
    else:
        priority_cert = 0

    completeness = int(cop_completeness * 100)

    # Weighted combination
    overall = round(
        ev_conf       * 0.50
        + priority_cert * 0.30
        + completeness  * 0.20
    )

    return ConfidenceBreakdown(
        evidence_confidence=ev_conf,
        priority_certainty=priority_cert,
        data_completeness=completeness,
        overall=min(overall, 99),
    )


def measure_cop_completeness(cop) -> float:
    """Return fraction of COP data layers that contain meaningful data (0.0–1.0)."""
    layers = [
        cop.weather.alert_level != "Green",
        cop.flood.detected,
        len(cop.incidents) > 0,
        len(cop.resources) > 0,
        len(cop.routes) > 0,
        len(cop.road_closures) > 0,
    ]
    return sum(layers) / len(layers)
