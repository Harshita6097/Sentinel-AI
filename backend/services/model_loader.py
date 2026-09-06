"""Centralized model loader for Vision Agent.

Models are loaded lazily on first use and cached for the process lifetime.
Set USE_MOCK_MODELS=false and place weights under MODELS_DIR to activate
real inference.

Model placement:
  D:\\GOALS\\Models\\SegFormer\\   — nvidia/segformer-b2-finetuned-ade-512-512
                                   or custom flood-segmentation weights
  D:\\GOALS\\Models\\Florence-2\\  — microsoft/Florence-2-base (trust_remote_code)
  Sentence Transformers are downloaded automatically to HF cache.
"""
import logging
import os
from pathlib import Path

logger = logging.getLogger(__name__)

MODELS_DIR = Path(os.getenv("MODELS_DIR", r"D:\GOALS\Models"))
USE_MOCK = os.getenv("USE_MOCK_MODELS", "true").lower() == "true"

_SEGFORMER_DIR = MODELS_DIR / "SegFormer"
_FLORENCE2_DIR = MODELS_DIR / "Florence-2"
_SENTENCE_MODEL = os.getenv("SENTENCE_MODEL", "all-MiniLM-L6-v2")

# Lazy singletons
_segformer_model = None
_segformer_processor = None
_florence2_model = None
_florence2_processor = None
_sentence_model = None


def load_segformer():
    """Return (model, processor) tuple or (None, None) in mock mode."""
    global _segformer_model, _segformer_processor
    if USE_MOCK:
        return None, None
    if _segformer_model is not None:
        return _segformer_model, _segformer_processor
    try:
        from transformers import SegformerForSemanticSegmentation, SegformerImageProcessor
        model_path = _SEGFORMER_DIR if _SEGFORMER_DIR.exists() else "nvidia/segformer-b2-finetuned-ade-512-512"
        logger.info("Loading SegFormer from %s", model_path)
        _segformer_processor = SegformerImageProcessor.from_pretrained(str(model_path))
        _segformer_model = SegformerForSemanticSegmentation.from_pretrained(str(model_path))
        _segformer_model.eval()
        logger.info("SegFormer loaded successfully")
        return _segformer_model, _segformer_processor
    except Exception as exc:
        logger.warning("SegFormer load failed (%s) — falling back to mock", exc)
        return None, None


def load_florence2():
    """Return (model, processor) tuple or (None, None) in mock mode."""
    global _florence2_model, _florence2_processor
    if USE_MOCK:
        return None, None
    if _florence2_model is not None:
        return _florence2_model, _florence2_processor
    try:
        from transformers import AutoModelForCausalLM, AutoProcessor
        model_path = _FLORENCE2_DIR if _FLORENCE2_DIR.exists() else "microsoft/Florence-2-base"
        logger.info("Loading Florence-2 from %s", model_path)
        _florence2_processor = AutoProcessor.from_pretrained(
            str(model_path), trust_remote_code=True
        )
        _florence2_model = AutoModelForCausalLM.from_pretrained(
            str(model_path), trust_remote_code=True
        )
        _florence2_model.eval()
        logger.info("Florence-2 loaded successfully")
        return _florence2_model, _florence2_processor
    except Exception as exc:
        logger.warning("Florence-2 load failed (%s) — falling back to mock", exc)
        return None, None


def load_sentence_transformer():
    """Return SentenceTransformer model or None in mock mode."""
    global _sentence_model
    if USE_MOCK:
        return None
    if _sentence_model is not None:
        return _sentence_model
    try:
        from sentence_transformers import SentenceTransformer
        logger.info("Loading SentenceTransformer: %s", _SENTENCE_MODEL)
        _sentence_model = SentenceTransformer(_SENTENCE_MODEL)
        logger.info("SentenceTransformer loaded successfully")
        return _sentence_model
    except Exception as exc:
        logger.warning("SentenceTransformer load failed (%s) — falling back to keyword similarity", exc)
        return None


def models_status() -> dict:
    """Return current load status of all models."""
    return {
        "segformer": "mock" if USE_MOCK else ("loaded" if _segformer_model else "unloaded"),
        "florence2": "mock" if USE_MOCK else ("loaded" if _florence2_model else "unloaded"),
        "sentence_transformer": "mock" if USE_MOCK else ("loaded" if _sentence_model else "unloaded"),
        "mock_mode": USE_MOCK,
        "models_dir": str(MODELS_DIR),
        "segformer_path": str(_SEGFORMER_DIR),
        "florence2_path": str(_FLORENCE2_DIR),
    }
