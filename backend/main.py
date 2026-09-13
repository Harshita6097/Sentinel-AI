import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from utils.logging_config import configure_logging
from utils.startup_checks import run_startup_checks
from api.map import router as map_router
from api.simulation import router as sim_router
from api.vision import router as vision_router
from api.emergency import router as emergency_router
from api.logistics import router as logistics_router
from api.commander import router as commander_router
from api.dashboard import router as dashboard_router
from api.reasoning import router as reasoning_router
from simulation import scheduler

configure_logging()
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Sentinel AI starting up…")
    app.state.startup_report = run_startup_checks()
    scheduler.start()
    _seed_initial_data()
    logger.info("Sentinel AI ready")
    yield
    scheduler.stop()
    logger.info("Sentinel AI shut down")


def _seed_initial_data() -> None:
    """Load mock incidents and run one pipeline cycle so the dashboard is never blank."""
    import threading
    def _run():
        try:
            from agents.emergency_agent import emergency_agent
            from services import incident_store
            from api.emergency import MOCK_REPORTS
            if not incident_store.list_all():
                for text in MOCK_REPORTS:
                    emergency_agent.process(text, source="mock")
            logger.info("Seeded %d mock incidents", len(incident_store.list_all()))
        except Exception as exc:
            logger.warning("Incident seeding failed: %s", exc)
        try:
            from graph.workflow import run_workflow
            from api.commander import set_last_recommendations
            from simulation.state_manager import get_state
            sim = get_state()
            result = run_workflow(sim_minutes=sim.current_minutes, sim_time=sim.current_time)
            set_last_recommendations(result.get("recommendations", []))
            logger.info("Initial pipeline run complete")
        except Exception as exc:
            logger.warning("Initial pipeline run failed: %s", exc)
    threading.Thread(target=_run, daemon=True, name="seed").start()


app = FastAPI(
    title="Sentinel AI API",
    version="1.0.0",
    description="Multi-Agent Disaster Response System — Kerala Flood Response",
    lifespan=lifespan,
)

_ALLOWED_ORIGINS = ["http://localhost:5173", "http://localhost:4173"]
_FRONTEND_URL = os.getenv("FRONTEND_URL", "")
if _FRONTEND_URL:
    _ALLOWED_ORIGINS.append(_FRONTEND_URL)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_ALLOWED_ORIGINS,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(map_router)
app.include_router(sim_router)
app.include_router(vision_router)
app.include_router(emergency_router)
app.include_router(logistics_router)
app.include_router(commander_router)
app.include_router(dashboard_router)
app.include_router(reasoning_router)


@app.get("/health")
def health():
    return {"status": "ok", "service": "sentinel-ai-backend", "version": "1.0.0"}


@app.get("/health/detailed")
def health_detailed():
    """Detailed health check including all service availability statuses."""
    return {
        "status": "ok",
        "service": "sentinel-ai-backend",
        "version": "1.0.0",
        "services": getattr(app.state, "startup_report", {}),
    }
