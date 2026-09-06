"""Centralized logging configuration for Sentinel AI.

Call configure_logging() once at application startup.
All modules use standard logging.getLogger(__name__).
"""
import logging
import os
import sys
from pathlib import Path

_LOG_DIR = Path(__file__).parent.parent / "logs"


def configure_logging() -> None:
    """Configure root logger with console + optional file handler."""
    app_env = os.getenv("APP_ENV", "development")
    default_level = "info" if app_env == "development" else "warning"
    level_str = os.getenv("LOG_LEVEL", default_level).upper()
    level = getattr(logging, level_str, logging.INFO)

    fmt = logging.Formatter(
        fmt="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    root = logging.getLogger()
    root.setLevel(level)

    if not any(isinstance(h, logging.StreamHandler) for h in root.handlers):
        ch = logging.StreamHandler(sys.stdout)
        ch.setFormatter(fmt)
        root.addHandler(ch)

    log_file = os.getenv("LOG_FILE", "")
    if not log_file and app_env == "production":
        _LOG_DIR.mkdir(exist_ok=True)
        log_file = str(_LOG_DIR / "sentinel.log")

    if log_file:
        try:
            fh = logging.FileHandler(log_file, encoding="utf-8")
            fh.setFormatter(fmt)
            root.addHandler(fh)
        except OSError:
            pass

    for noisy in ("httpx", "httpcore", "urllib3", "transformers", "torch"):
        logging.getLogger(noisy).setLevel(logging.WARNING)
