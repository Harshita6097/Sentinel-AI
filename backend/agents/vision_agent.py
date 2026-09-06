"""
Vision Agent — orchestrates the full image analysis pipeline.

Pipeline:
  1. Validate image bytes and MIME type
  2. Run flood segmentation (SegFormer interface)
  3. Run scene description (Florence-2 interface)
  4. Calculate confidence scores
  5. Return structured VisionAnalysis result

This agent is consumed by the Commander agent in future milestones.
"""
import hashlib
from dataclasses import dataclass, asdict
from services.segmentation_service import run_segmentation, SegmentationResult
from services.scene_description_service import run_scene_description, SceneDescription
from services.confidence_service import calculate_confidence, ConfidenceScore

ALLOWED_MIME = {"image/jpeg", "image/png", "image/webp", "image/tiff"}
MAX_BYTES = 20 * 1024 * 1024  # 20 MB


@dataclass
class VisionAnalysis:
    image_hash: str
    analysis: SegmentationResult
    scene_description: SceneDescription
    confidence: ConfidenceScore

    def to_dict(self) -> dict:
        return {
            "image_hash": self.image_hash,
            "analysis": asdict(self.analysis),
            "scene_description": asdict(self.scene_description),
            "confidence": asdict(self.confidence),
        }


class VisionAgent:
    """
    Stateless vision analysis agent.

    Instantiate once at app startup; call .analyze() per request.
    """

    def validate(self, image_bytes: bytes, content_type: str) -> None:
        """
        Validate uploaded image before processing.

        Raises:
            ValueError: If file type or size is invalid.
        """
        if content_type not in ALLOWED_MIME:
            raise ValueError(f"Unsupported image type '{content_type}'. Allowed: {ALLOWED_MIME}")
        if len(image_bytes) > MAX_BYTES:
            raise ValueError(f"Image exceeds 20 MB limit ({len(image_bytes) // 1024} KB received).")
        if len(image_bytes) < 100:
            raise ValueError("Image file appears to be empty or corrupt.")

    def analyze(self, image_bytes: bytes, content_type: str) -> VisionAnalysis:
        """
        Run the full vision analysis pipeline on an uploaded image.

        Args:
            image_bytes:  Raw bytes of the uploaded image.
            content_type: MIME type string (e.g. 'image/jpeg').

        Returns:
            VisionAnalysis containing segmentation, scene description, and confidence.
        """
        self.validate(image_bytes, content_type)

        image_hash = hashlib.sha256(image_bytes).hexdigest()[:16]
        seg: SegmentationResult = run_segmentation(image_bytes)
        scene: SceneDescription = run_scene_description(image_bytes)
        confidence: ConfidenceScore = calculate_confidence(seg, scene)

        return VisionAnalysis(
            image_hash=image_hash,
            analysis=seg,
            scene_description=scene,
            confidence=confidence,
        )


# Module-level singleton — shared across all requests
vision_agent = VisionAgent()
