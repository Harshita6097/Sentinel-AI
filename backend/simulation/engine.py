"""Core simulation engine: advances virtual clock and fires timeline events."""
from simulation.state_manager import (
    get_state, get_timeline, reset_state,
    SIM_START, SIM_END,
)

# How many virtual minutes advance per real-world tick (1 s)
_TICK_VIRTUAL_MINUTES = 1


def _apply_location_override(state, event) -> None:
    """Derive marker visual overrides from an event's type and affected IDs."""
    override_map = {
        "hospital_sos":    {"status": "SOS", "alert": "critical"},
        "road_blocked":    {"status": "Blocked", "alert": "high"},
        "shelter_capacity":{"status": "Near Capacity", "alert": "high"},
        "flood":           {"status": "Flooded", "alert": "high"},
        "resource_deploy": {"status": "Deployed", "alert": "low"},
        "rescue":          {"status": "Rescue Active", "alert": "medium"},
        "weather":         {"status": "Alert", "alert": "medium"},
    }
    override = override_map.get(event.type)
    if override:
        for loc_id in event.affects:
            state.location_overrides[loc_id] = override


def tick() -> None:
    """Advance the simulation clock by one tick (called by scheduler every second)."""
    state = get_state()  # always fetch current singleton — safe after reset
    if state.paused or state.finished:
        return

    state.current_minutes = min(
        state.current_minutes + (_TICK_VIRTUAL_MINUTES * state.speed),
        SIM_END,
    )
    _fire_due_events(state)


def _fire_due_events(state) -> None:
    """Trigger any timeline events whose time has been reached."""
    for event in get_timeline():
        if event.id not in state.triggered_ids and event.minutes <= state.current_minutes:
            state.triggered_ids.add(event.id)
            state.active_events.insert(0, event)   # newest first
            _apply_location_override(state, event)
            _notify_logistics(event, state.current_minutes)


def play() -> None:
    """Resume the simulation."""
    state = get_state()
    if not state.finished:
        state.paused = False


def pause() -> None:
    """Pause the simulation."""
    get_state().paused = True


def reset() -> None:
    """Reset simulation to t=09:00."""
    reset_state()
    try:
        from agents.logistics_agent import logistics_agent
        logistics_agent.reset()
    except Exception:
        pass


def step() -> None:
    """Advance exactly one virtual minute regardless of pause state."""
    state = get_state()
    if state.finished:
        return
    state.current_minutes = min(state.current_minutes + 1, SIM_END)
    _fire_due_events(state)


def set_speed(speed: int) -> None:
    """Set playback speed multiplier (1, 2, or 5)."""
    if speed not in (1, 2, 5):
        raise ValueError("Speed must be 1, 2, or 5")
    get_state().speed = speed


def _notify_logistics(event, current_minutes: int) -> None:
    """Forward simulation events to the logistics agent (import deferred to avoid circular)."""
    try:
        from agents.logistics_agent import logistics_agent
        logistics_agent.handle_simulation_event(
            event.type, event.location, event.id, current_minutes
        )
    except Exception:
        pass  # logistics errors must never crash the simulation loop
