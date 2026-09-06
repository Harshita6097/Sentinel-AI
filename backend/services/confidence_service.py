"""
Confidence scoring service.

Combines per-model confidence values into an overall score.
Scores are mock values derived from risk level and description quality.
Real values will come from model logits / softmax probabilities.
"""
from dataclasses import dataclass
from services.segmentation_service import SegmentationResult
from services.scene_description_service import SceneDescription

_RISK_SEG_CONFIDENCE = {
    "Low": 88,
    "Medium": 91,
    "High": 94,
    "Critical": 96,
}

_DEPTH_SCENE_CONFIDENCE = {
    "shallow": 87,
    "moderate": 91,
    "deep": 93,
}


@dataclass
class ConfidenceScore:
    segmentation: int      # 0–100
    scene_understanding: int
    overall: int
    grade: str             # A | B | C | D


def _grade(score: int) -> str:
    if score >= 90: return "A"
    if score >= 80: return "B"
    if score >= 70: return "C"
    return "D"


def calculate_confidence(
    seg: SegmentationResult,
    scene: SceneDescription,
) -> ConfidenceScore:
    """
    Derive confidence scores from segmentation and scene description results.

    Args:
        seg:   Result from segmentation_service.
        scene: Result from scene_description_service.

    Returns:
        ConfidenceScore with per-model and overall values.
    """
    seg_conf = _RISK_SEG_CONFIDENCE.get(seg.risk_level, 85)
    scene_conf = _DEPTH_SCENE_CONFIDENCE.get(seg.water_depth_estimate, 88)

    # Penalise slightly when no flood detected (lower signal)
    if not seg.flood_detected:
        seg_conf = max(seg_conf - 8, 70)
        scene_conf = max(scene_conf - 5, 70)

    overall = round((seg_conf * 0.55) + (scene_conf * 0.45))

    return ConfidenceScore(
        segmentation=seg_conf,
        scene_understanding=scene_conf,
        overall=overall,
        grade=_grade(overall),
    )
