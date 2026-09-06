"""Flood segmentation service.

Real inference path uses SegFormer (nvidia/segformer-b2-finetuned-ade-512-512
or custom flood weights). Falls back to deterministic mock when USE_MOCK_MODELS=true
or when weights are unavailable.

ADE20K class indices used for flood proxy:
  - 21: water  — direct flood indicator
  - 26: sea    — coastal flood
  - 60: river  — river overflow
"""
import hashlib
import io
import logging
from dataclasses import dataclass

from services.model_loader import load_segformer, USE_MOCK

logger = logging.getLogger(__name__)

_WATER_CLASSES = {21, 26, 60, 128}

_RISK_ZONES = [
    ["Coastal belt", "Low-lying residential areas"],
    ["Agricultural fields", "River delta regions"],
    ["Urban drainage zones", "Coastal belt"],
    ["River banks", "Low-lying residential areas", "Agricultural fields"],
    ["Urban drainage zones", "River banks", "Coastal belt"],
]
_DEPTH_LEVELS = ["shallow", "shallow", "moderate", "moderate", "deep"]


@dataclass
class SegmentationResult:
    flood_detected: bool
    coverage_percent: int
    risk_level: str
    affected_zones: list[str]
    water_depth_estimate: str
    model_used: str


def _mock_segmentation(image_bytes: bytes) -> SegmentationResult:
    digest = int(hashlib.md5(image_bytes[:512]).hexdigest(), 16)
    bucket = digest % 5
    coverage = [12, 27, 37, 54, 68][bucket]
    risk = ["Low", "Medium", "High", "High", "Critical"][bucket]
    return SegmentationResult(
        flood_detected=coverage > 10,
        coverage_percent=coverage,
        risk_level=risk,
        affected_zones=_RISK_ZONES[bucket],
        water_depth_estimate=_DEPTH_LEVELS[bucket],
        model_used="mock-segformer-v0",
    )


def _real_segmentation(image_bytes: bytes, model, processor) -> SegmentationResult:
    try:
        import torch
        import numpy as np
        from PIL import Image

        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        inputs = processor(images=image, return_tensors="pt")

        with torch.no_grad():
            outputs = model(**inputs)

        upsampled = torch.nn.functional.interpolate(
            outputs.logits,
            size=image.size[::-1],
            mode="bilinear",
            align_corners=False,
        )
        seg_map = upsampled.argmax(dim=1).squeeze().numpy()

        total_pixels = seg_map.size
        water_pixels = sum(int(np.sum(seg_map == cls)) for cls in _WATER_CLASSES)
        coverage = round((water_pixels / total_pixels) * 100)

        if coverage >= 50:
            risk, depth, bucket = "Critical", "deep", 4
        elif coverage >= 30:
            risk, depth, bucket = "High", "moderate", 3
        elif coverage >= 15:
            risk, depth, bucket = "High", "moderate", 2
        elif coverage >= 5:
            risk, depth, bucket = "Medium", "shallow", 1
        else:
            risk, depth, bucket = "Low", "shallow", 0

        return SegmentationResult(
            flood_detected=coverage > 5,
            coverage_percent=min(coverage, 100),
            risk_level=risk,
            affected_zones=_RISK_ZONES[bucket],
            water_depth_estimate=depth,
            model_used="segformer-b2-ade512",
        )
    except Exception as exc:
        logger.warning("SegFormer inference failed (%s) — using mock", exc)
        return _mock_segmentation(image_bytes)


def run_segmentation(image_bytes: bytes) -> SegmentationResult:
    """Run flood segmentation on raw image bytes."""
    model, processor = load_segformer()
    if USE_MOCK or model is None:
        return _mock_segmentation(image_bytes)
    return _real_segmentation(image_bytes, model, processor)
