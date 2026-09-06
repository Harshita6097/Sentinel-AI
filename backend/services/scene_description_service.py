"""Scene description service.

Real inference path uses Florence-2 (microsoft/Florence-2-base) with the
<DETAILED_CAPTION> task prompt. Falls back to deterministic mock when
USE_MOCK_MODELS=true or when weights are unavailable.
"""
import hashlib
import io
import logging
from dataclasses import dataclass

from services.model_loader import load_florence2, USE_MOCK

logger = logging.getLogger(__name__)


@dataclass
class SceneDescription:
    caption: str
    key_observations: list[str]
    infrastructure_status: str
    civilian_presence: str
    model_used: str


_DESCRIPTIONS = [
    SceneDescription(
        caption="Floodwater has inundated low-lying residential streets. Water level appears 30–50 cm above road surface.",
        key_observations=["Submerged road markings", "Waterlogged vehicles", "Residents on rooftops"],
        infrastructure_status="Roads impassable, power lines at risk",
        civilian_presence="Multiple civilians visible requiring evacuation",
        model_used="mock-florence2-v0",
    ),
    SceneDescription(
        caption="Agricultural land is extensively flooded. Crop fields are fully submerged with debris visible in the water.",
        key_observations=["Submerged farmland", "Floating debris", "Damaged irrigation channels"],
        infrastructure_status="Farm access roads blocked, irrigation infrastructure damaged",
        civilian_presence="No civilians visible in immediate area",
        model_used="mock-florence2-v0",
    ),
    SceneDescription(
        caption="Floodwater is covering the roadway and surrounding buildings. Several vehicles appear partially submerged.",
        key_observations=["Partially submerged vehicles", "Flooded ground floors", "Debris in water flow"],
        infrastructure_status="Main road flooded, buildings at ground level compromised",
        civilian_presence="Small group visible on elevated ground nearby",
        model_used="mock-florence2-v0",
    ),
    SceneDescription(
        caption="River has breached its banks causing widespread inundation. Water is flowing rapidly through urban areas.",
        key_observations=["River bank breach visible", "Fast-moving water", "Submerged street furniture"],
        infrastructure_status="Bridge approach roads flooded, utilities at risk",
        civilian_presence="Evacuation in progress, rescue boats visible",
        model_used="mock-florence2-v0",
    ),
    SceneDescription(
        caption="Severe flooding across urban district. Multi-storey buildings partially submerged up to first floor level.",
        key_observations=["First-floor submersion", "Stranded vehicles on elevated roads", "Emergency services active"],
        infrastructure_status="Critical infrastructure compromised, hospital access blocked",
        civilian_presence="High civilian density, multiple rescue operations underway",
        model_used="mock-florence2-v0",
    ),
]


def _mock_description(image_bytes: bytes) -> SceneDescription:
    digest = int(hashlib.md5(image_bytes[:512]).hexdigest(), 16)
    return _DESCRIPTIONS[digest % len(_DESCRIPTIONS)]


def _parse_florence_output(caption: str) -> SceneDescription:
    lower = caption.lower()
    observations = []
    if any(w in lower for w in ["vehicle", "car", "truck"]):
        observations.append("Vehicles visible in scene")
    if any(w in lower for w in ["water", "flood", "submerged"]):
        observations.append("Floodwater present")
    if any(w in lower for w in ["building", "house", "structure"]):
        observations.append("Structures affected")
    if any(w in lower for w in ["road", "street", "highway"]):
        observations.append("Road infrastructure impacted")
    if any(w in lower for w in ["person", "people", "civilian", "resident"]):
        observations.append("Civilians visible")
    if not observations:
        observations = ["Scene captured by Florence-2"]

    if any(w in lower for w in ["blocked", "impassable", "flooded road"]):
        infra = "Road access compromised"
    elif any(w in lower for w in ["damaged", "collapsed", "destroyed"]):
        infra = "Infrastructure damage detected"
    else:
        infra = "Infrastructure status unclear from image"

    civilian = (
        "Civilians detected in scene"
        if any(w in lower for w in ["person", "people", "civilian", "resident", "crowd"])
        else "No civilians clearly visible"
    )

    return SceneDescription(
        caption=caption.strip(),
        key_observations=observations,
        infrastructure_status=infra,
        civilian_presence=civilian,
        model_used="florence-2-base",
    )


def _real_description(image_bytes: bytes, model, processor) -> SceneDescription:
    try:
        import torch
        from PIL import Image

        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        prompt = "<DETAILED_CAPTION>"
        inputs = processor(text=prompt, images=image, return_tensors="pt")

        with torch.no_grad():
            generated_ids = model.generate(
                input_ids=inputs["input_ids"],
                pixel_values=inputs["pixel_values"],
                max_new_tokens=256,
                num_beams=3,
                early_stopping=True,
            )

        raw = processor.batch_decode(generated_ids, skip_special_tokens=False)[0]
        caption = processor.post_process_generation(
            raw, task=prompt, image_size=(image.width, image.height)
        )
        if isinstance(caption, dict):
            caption = caption.get(prompt, str(caption))

        return _parse_florence_output(str(caption))
    except Exception as exc:
        logger.warning("Florence-2 inference failed (%s) — using mock", exc)
        return _mock_description(image_bytes)


def run_scene_description(image_bytes: bytes) -> SceneDescription:
    """Generate a natural-language scene description from image bytes."""
    model, processor = load_florence2()
    if USE_MOCK or model is None:
        return _mock_description(image_bytes)
    return _real_description(image_bytes, model, processor)
