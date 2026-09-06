"""Background scheduler: calls engine.tick() every real-world second with drift correction."""
import threading
import time as _time
from simulation import engine

_thread: threading.Thread | None = None
_stop_event = threading.Event()


def _loop() -> None:
    """Tick loop with drift correction: measures actual elapsed time and adjusts sleep."""
    next_tick = _time.monotonic() + 1.0
    while not _stop_event.is_set():
        engine.tick()
        now = _time.monotonic()
        sleep_for = next_tick - now
        if sleep_for > 0:
            _time.sleep(sleep_for)
        next_tick += 1.0  # always advance by exactly 1s regardless of processing time


def start() -> None:
    """Start the background tick thread (idempotent)."""
    global _thread
    if _thread and _thread.is_alive():
        return
    _stop_event.clear()
    _thread = threading.Thread(target=_loop, daemon=True, name="sim-scheduler")
    _thread.start()


def stop() -> None:
    """Stop the background tick thread."""
    _stop_event.set()
