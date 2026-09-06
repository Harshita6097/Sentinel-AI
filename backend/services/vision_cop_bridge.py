"""Vision COP Bridge.

Caches the most recent VisionAnalysis result so the LangGraph
vision node can sync it into the COP without re-running inference.

The vision agent is triggered by user image uploads (async).
This bridge decouples the upload event from the orchestration cycle.
"""
from services.cop_manager import FloodSnapshot

_latest_analysis = None   # VisionAnalysis | None


def cache_vision_result(analysis) -> None:
    """Called by the vision API after a successful analysis."""
    global _latest_analysis
    _latest_analysis = analysis


def get_latest_vision_snapshot() -> FloodSnapshot:
    """Return a FloodSnapshot from the cached analysis, or a default."""
    if _latest_analysis is None:
        return FloodSnapshot()

    seg = _latest_analysis.analysis
    return FloodSnapshot(
        detected=seg.flood_detected,
        coverage_percent=seg.coverage_percent,
        risk_level=seg.risk_level,
        water_depth=seg.water_depth_estimate,
        affected_zones=list(seg.affected_zones),
        source="vision",
    )
