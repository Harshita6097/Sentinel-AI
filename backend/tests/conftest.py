"""Shared pytest fixtures for Sentinel AI backend tests."""
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

os.environ.setdefault("USE_MOCK_MODELS", "true")
os.environ.setdefault("APP_ENV", "test")
os.environ.setdefault("CHROMA_PERSIST_DIR", "/tmp/sentinel_test_chroma")

import pytest
from fastapi.testclient import TestClient


@pytest.fixture(scope="session")
def client():
    from main import app
    with TestClient(app) as c:
        yield c


@pytest.fixture(autouse=True)
def reset_simulation():
    from simulation import engine
    engine.reset()
    yield
    engine.reset()


@pytest.fixture(autouse=True)
def reset_incidents():
    from services import incident_store
    incident_store.clear()
    yield
    incident_store.clear()
