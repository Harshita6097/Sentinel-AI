"""Simulation control and state API endpoints."""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from simulation import engine
from simulation.state_manager import get_state, get_timeline

router = APIRouter(prefix="/api/simulation", tags=["simulation"])


# ── Response schemas ──────────────────────────────────────────────────────────

class EventOut(BaseModel):
    id: int
    time: str
    type: str
    location: str
    severity: str
    description: str
    affects: list[int]


class SimStateOut(BaseModel):
    time: str
    current_minutes: int
    paused: bool
    finished: bool
    speed: int
    progress: float
    active_events: list[EventOut]
    location_overrides: dict[str, dict]   # key is str for JSON compat


class SpeedIn(BaseModel):
    speed: int


# ── Helpers ───────────────────────────────────────────────────────────────────

def _state_response() -> SimStateOut:
    s = get_state()
    return SimStateOut(
        time=s.current_time,
        current_minutes=s.current_minutes,
        paused=s.paused,
        finished=s.finished,
        speed=s.speed,
        progress=round(s.progress, 4),
        active_events=[EventOut(**e.__dict__) for e in s.active_events],
        location_overrides={str(k): v for k, v in s.location_overrides.items()},
    )


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/state", response_model=SimStateOut)
def get_sim_state():
    """Return the full current simulation state."""
    return _state_response()


@router.post("/play", response_model=SimStateOut)
def play():
    """Resume simulation playback."""
    engine.play()
    return _state_response()


@router.post("/pause", response_model=SimStateOut)
def pause():
    """Pause simulation playback."""
    engine.pause()
    return _state_response()


@router.post("/reset", response_model=SimStateOut)
def reset():
    """Reset simulation to t=09:00."""
    engine.reset()
    return _state_response()


@router.post("/step", response_model=SimStateOut)
def step():
    """Advance simulation by exactly one virtual minute."""
    engine.step()
    return _state_response()


@router.post("/speed", response_model=SimStateOut)
def set_speed(body: SpeedIn):
    """Set playback speed: 1, 2, or 5."""
    try:
        engine.set_speed(body.speed)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return _state_response()


@router.get("/timeline", response_model=list[EventOut])
def get_full_timeline():
    """Return the complete event timeline (all 16 events)."""
    return [EventOut(**e.__dict__) for e in get_timeline()]
