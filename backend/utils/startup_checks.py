"""Startup checks — validate environment and report service availability.

Called during FastAPI lifespan startup. Failures are logged as warnings,
never errors — the application always starts regardless of optional
service availability.
"""
import logging
import os
from pathlib import Path

logger = logging.getLogger(__name__)


def run_startup_checks() -> dict:
    """Run all startup checks and return a status report dict."""
    report = {
        "env":         _check_env(),
        "models":      _check_models(),
        "chroma":      _check_chroma(),
        "osm_cache":   _check_osm_cache(),
        "weather_api": _check_weather_api(),
    }
    _log_report(report)
    return report


def _check_env() -> dict:
    optional = ["OPENWEATHER_API_KEY", "MODELS_DIR", "CHROMA_PERSIST_DIR", "LOG_LEVEL", "FRONTEND_URL"]
    return {
        "ok": True,
        "missing_optional": [k for k in optional if not os.getenv(k)],
    }


def _check_models() -> dict:
    from services.model_loader import models_status
    s = models_status()
    return {
        "mock_mode":           s["mock_mode"],
        "segformer":           s["segformer"],
        "florence2":           s["florence2"],
        "sentence_transformer": s["sentence_transformer"],
        "models_dir_exists":   Path(s["models_dir"]).exists(),
    }


def _check_chroma() -> dict:
    try:
        from services.chroma_store import chroma_store
        available = chroma_store.is_available()
        return {"available": available, "incident_count": chroma_store.count() if available else 0}
    except Exception as exc:
        return {"available": False, "error": str(exc)}


def _check_osm_cache() -> dict:
    cache_path = Path(__file__).parent.parent / "datasets" / "osm" / "kerala_drive.graphml"
    return {
        "cached":   cache_path.exists(),
        "path":     str(cache_path),
        "size_mb":  round(cache_path.stat().st_size / 1_048_576, 1) if cache_path.exists() else 0,
    }


def _check_weather_api() -> dict:
    key  = os.getenv("OPENWEATHER_API_KEY", "")
    live = os.getenv("WEATHER_LIVE", "false").lower() == "true"
    return {
        "api_key_set": bool(key),
        "live_enabled": live,
        "mode": "live" if (key and live) else "simulation",
    }


def _log_report(report: dict) -> None:
    logger.info("=== Sentinel AI Startup Checks ===")
    if report["env"]["missing_optional"]:
        logger.info("Optional env vars not set: %s", ", ".join(report["env"]["missing_optional"]))
    m = report["models"]
    logger.info("Models    : mock=%s | segformer=%s | florence2=%s | sentence=%s",
                m["mock_mode"], m["segformer"], m["florence2"], m["sentence_transformer"])
    c = report["chroma"]
    logger.info("ChromaDB  : available=%s | incidents=%s", c["available"], c.get("incident_count", "N/A"))
    o = report["osm_cache"]
    logger.info("OSM cache : cached=%s | size=%sMB", o["cached"], o["size_mb"])
    w = report["weather_api"]
    logger.info("Weather   : mode=%s | api_key=%s", w["mode"], "set" if w["api_key_set"] else "not set")
    logger.info("==================================")
