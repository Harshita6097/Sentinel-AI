"""Loads and parses the Kerala flood timeline from timeline.json."""
import json
from dataclasses import dataclass, field
from pathlib import Path

TIMELINE_PATH = Path(__file__).parent / "timeline.json"


@dataclass
class SimEvent:
    id: int
    time: str          # "HH:MM"
    type: str
    location: str
    severity: str      # low | medium | high | critical
    description: str
    affects: list[int] = field(default_factory=list)

    @property
    def minutes(self) -> int:
        """Return event time as minutes since midnight."""
        h, m = self.time.split(":")
        return int(h) * 60 + int(m)


def load_timeline() -> list[SimEvent]:
    """Load all events from timeline.json sorted by time."""
    raw = json.loads(TIMELINE_PATH.read_text(encoding="utf-8"))
    events = [SimEvent(**e) for e in raw]
    return sorted(events, key=lambda e: e.minutes)
