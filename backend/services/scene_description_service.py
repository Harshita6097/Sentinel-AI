"""
Scene description service.

Interface matches future Florence-2 integration.
Mock descriptions are selected deterministically from a curated bank
of realistic Kerala flood scene descriptions.
"""
import hashlib
from dataclasses import dataclass
from services.model_loader import load_florence2, USE_MOCK


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
    """
    Return a deterministic mock scene description based on image hash.
    TODO: Replace with real Florence-2 inference when weights are loaded.
    """
    digest = int(hashlib.md5(image_bytes[:512]).hexdigest(), 16)
    return _DESCRIPTIONS[digest % len(_DESCRIPTIONS)]


def run_scene_description(image_bytes: bytes) -> SceneDescription:
    """
    Generate a natural-language scene description from image bytes.

    Args:
        image_bytes: Raw bytes of the uploaded image.

    Returns:
        SceneDescription with caption and structured observations.
    """
    model = load_florence2()
    if USE_MOCK or model is None:
        return _mock_description(image_bytes)

    # TODO: Real Florence-2 inference path
    # processor = AutoProcessor.from_pretrained(..., trust_remote_code=True)
    # inputs = processor(text="<DETAILED_CAPTION>", images=image, return_tensors="pt")
    # generated_ids = model.generate(**inputs, max_new_tokens=256)
    # caption = processor.batch_decode(generated_ids, skip_special_tokens=True)[0]
    raise NotImplementedError("Real scene description not yet implemented.")
