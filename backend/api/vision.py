"""Vision Agent API endpoints."""
from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from agents.vision_agent import vision_agent
from services.model_loader import models_status
from services.vision_cop_bridge import cache_vision_result

router = APIRouter(prefix="/api/vision", tags=["vision"])


# ── Response schemas ──────────────────────────────────────────────────────────

class SegmentationOut(BaseModel):
    flood_detected: bool
    coverage_percent: int
    risk_level: str
    affected_zones: list[str]
    water_depth_estimate: str
    model_used: str


class SceneOut(BaseModel):
    caption: str
    key_observations: list[str]
    infrastructure_status: str
    civilian_presence: str
    model_used: str


class ConfidenceOut(BaseModel):
    segmentation: int
    scene_understanding: int
    overall: int
    grade: str


class VisionResponse(BaseModel):
    image_hash: str
    analysis: SegmentationOut
    scene_description: SceneOut
    confidence: ConfidenceOut


class VisionHealthOut(BaseModel):
    status: str
    mock_mode: bool
    models: dict


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/analyze", response_model=VisionResponse)
async def analyze_image(file: UploadFile = File(...)):
    """
    Accept an uploaded image and return flood analysis results.

    Supports JPEG, PNG, WebP, TIFF up to 20 MB.
    """
    image_bytes = await file.read()
    content_type = file.content_type or "application/octet-stream"

    try:
        result = vision_agent.analyze(image_bytes, content_type)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    # Cache result so the LangGraph vision node can sync it into the COP
    cache_vision_result(result)

    return VisionResponse(**result.to_dict())


@router.get("/health", response_model=VisionHealthOut)
def vision_health():
    """Return Vision Agent service status and model load state."""
    status = models_status()
    return VisionHealthOut(
        status="operational",
        mock_mode=status["mock_mode"],
        models=status,
    )
