"""Singleton simulation state shared across engine, scheduler, and API."""
from dataclasses import dataclass, field
from simulation.events import SimEvent, load_timeline

# Simulation time boundaries (minutes since midnight)
SIM_START = 9 * 60       # 09:00
SIM_END   = 14 * 60 + 30 # 14:30


@dataclass
class SimulationState:
    current_minutes: int = SIM_START
    paused: bool = True
    speed: int = 1                          # 1 | 2 | 5
    active_events: list[SimEvent] = field(default_factory=list)
    triggered_ids: set[int] = field(default_factory=set)
    location_overrides: dict[int, dict] = field(default_factory=dict)

    @property
    def current_time(self) -> str:
        h, m = divmod(self.current_minutes, 60)
        return f"{h:02d}:{m:02d}"

    @property
    def progress(self) -> float:
        """0.0 – 1.0 progress through the timeline."""
        span = SIM_END - SIM_START
        return min((self.current_minutes - SIM_START) / span, 1.0)

    @property
    def finished(self) -> bool:
        return self.current_minutes >= SIM_END


# Module-level singleton
_state = SimulationState()
_timeline: list[SimEvent] = load_timeline()


def get_state() -> SimulationState:
    return _state


def get_timeline() -> list[SimEvent]:
    return _timeline


def reset_state() -> None:
    """Reset simulation to initial conditions."""
    global _state
    _state = SimulationState()
