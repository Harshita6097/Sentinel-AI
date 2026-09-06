"""
Flood segmentation service.

Interface matches future SegFormer integration.
Mock output is deterministic based on image filename hash so results
are consistent across repeated uploads of the same file.
"""
import hashlib
from dataclasses import dataclass
from services.model_loader import load_segformer, USE_MOCK


@dataclass
class SegmentationResult:
    flood_detected: bool
    coverage_percent: int          # 0–100
    risk_level: str                # Low | Medium | High | Critical
    affected_zones: list[str]
    water_depth_estimate: str      # shallow | moderate | deep
    model_used: str


_RISK_ZONES = [
    ["Coastal belt", "Low-lying residential areas"],
    ["Agricultural fields", "River delta regions"],
    ["Urban drainage zones", "Coastal belt"],
    ["River banks", "Low-lying residential areas", "Agricultural fields"],
    ["Urban drainage zones", "River banks", "Coastal belt"],
]

_DEPTH_LEVELS = ["shallow", "shallow", "moderate", "moderate", "deep"]


def _mock_segmentation(image_bytes: bytes) -> SegmentationResult:
    """
    Produce deterministic mock segmentation from image content hash.
    TODO: Replace with real SegFormer inference when weights are loaded.
    """
    digest = int(hashlib.md5(image_bytes[:512]).hexdigest(), 16)
    bucket = digest % 5                          # 0–4 → five distinct scenarios

    coverage = [12, 27, 37, 54, 68][bucket]
    risk = ["Low", "Medium", "High", "High", "Critical"][bucket]
    detected = coverage > 10

    return SegmentationResult(
        flood_detected=detected,
        coverage_percent=coverage,
        risk_level=risk,
        affected_zones=_RISK_ZONES[bucket],
        water_depth_estimate=_DEPTH_LEVELS[bucket],
        model_used="mock-segformer-v0",
    )


def run_segmentation(image_bytes: bytes) -> SegmentationResult:
    """
    Run flood segmentation on raw image bytes.

    Args:
        image_bytes: Raw bytes of the uploaded image.

    Returns:
        SegmentationResult with flood extent and risk data.
    """
    model = load_segformer()
    if USE_MOCK or model is None:
        return _mock_segmentation(image_bytes)

    # TODO: Real SegFormer inference path
    # from transformers import SegformerImageProcessor
    # processor = SegformerImageProcessor.from_pretrained(...)
    # inputs = processor(images=Image.open(io.BytesIO(image_bytes)), return_tensors="pt")
    # outputs = model(**inputs)
    # ... decode segmentation mask → coverage, risk_level
    raise NotImplementedError("Real segmentation not yet implemented.")
