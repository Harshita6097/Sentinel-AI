"""Background scheduler: calls engine.tick() every real-world second."""
import threading
import time as _time
from simulation import engine

_thread: threading.Thread | None = None
_stop_event = threading.Event()


def _loop() -> None:
    while not _stop_event.is_set():
        engine.tick()
        _time.sleep(1.0)


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
