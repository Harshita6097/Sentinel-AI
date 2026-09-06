"""
Centralized model loader for Vision Agent.

Models are loaded lazily on first use.
Real weights will be loaded from D:\\GOALS\\Models\\ when available.

TODO (Milestone 5+):
  - SegFormer:  load from D:\\GOALS\\Models\\segformer-flood\\
  - Florence-2: load from D:\\GOALS\\Models\\florence2\\
  - Set USE_MOCK_MODELS=false in .env to activate real inference
"""
import os
from pathlib import Path

MODELS_DIR = Path(os.getenv("MODELS_DIR", r"D:\GOALS\Models"))
USE_MOCK = os.getenv("USE_MOCK_MODELS", "true").lower() == "true"

# Lazy singletons — populated on first call
_segformer_model = None
_florence2_model = None


def load_segformer():
    """
    Return the SegFormer flood-segmentation model.
    Currently returns None (mock mode). Replace body when weights are available.
    """
    global _segformer_model
    if USE_MOCK:
        return None  # TODO: load nvidia/segformer-b2-finetuned-ade-512-512 or custom flood weights
    if _segformer_model is None:
        # TODO: from transformers import SegformerForSemanticSegmentation
        # _segformer_model = SegformerForSemanticSegmentation.from_pretrained(
        #     MODELS_DIR / "segformer-flood"
        # )
        raise NotImplementedError("SegFormer weights not yet available.")
    return _segformer_model


def load_florence2():
    """
    Return the Florence-2 vision-language model.
    Currently returns None (mock mode). Replace body when weights are available.
    """
    global _florence2_model
    if USE_MOCK:
        return None  # TODO: load microsoft/Florence-2-base or fine-tuned disaster variant
    if _florence2_model is None:
        # TODO: from transformers import AutoModelForCausalLM, AutoProcessor
        # _florence2_model = AutoModelForCausalLM.from_pretrained(
        #     MODELS_DIR / "florence2", trust_remote_code=True
        # )
        raise NotImplementedError("Florence-2 weights not yet available.")
    return _florence2_model


def models_status() -> dict:
    """Return current load status of all models."""
    return {
        "segformer": "mock" if USE_MOCK else ("loaded" if _segformer_model else "unloaded"),
        "florence2": "mock" if USE_MOCK else ("loaded" if _florence2_model else "unloaded"),
        "mock_mode": USE_MOCK,
        "models_dir": str(MODELS_DIR),
    }
