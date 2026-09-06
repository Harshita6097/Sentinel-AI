"""Weather Agent — mock forecast provider.

Produces deterministic weather snapshots based on simulation time
and active simulation events. Designed for future replacement with
a real weather API (IMD, OpenWeatherMap) without changing the COP
write interface.

Escalation logic mirrors the Kerala flood timeline:
  09:00 → Orange alert (heavy rain begins)
  10:45 → Red alert (Thrissur/Palakkad)
  14:30 → Red alert statewide
"""
from dataclasses import dataclass

from services.cop_manager import WeatherSnapshot, get_cop, update_cop


# Simulation-time-based weather escalation table
# Each entry: (from_minutes, condition, rainfall_mm_hr, alert_level, wind_kmh)
_ESCALATION: list[tuple[int, str, float, str, float]] = [
    (540,  "Heavy Rain",   8.0,  "Orange", 25.0),   # 09:00
    (645,  "Heavy Rain",  12.0,  "Orange", 30.0),   # 10:45
    (660,  "Extreme Rain", 20.0, "Red",    40.0),   # 11:00
    (750,  "Extreme Rain", 28.0, "Red",    50.0),   # 12:30
    (870,  "Extreme Rain", 35.0, "Red",    55.0),   # 14:30
]


@dataclass
class WeatherForecast:
    condition: str
    rainfall_mm_hr: float
    alert_level: str
    wind_kmh: float
    visibility: str
    confidence: int


class WeatherAgent:
    """Stateless weather agent. Call .update(sim_minutes) each orchestration cycle."""

    def update(self, sim_minutes: int) -> WeatherForecast:
        """
        Produce a weather forecast for the given simulation time and
        write it to the COP.

        Args:
            sim_minutes: Current simulation time in minutes since midnight.

        Returns:
            WeatherForecast snapshot.
        """
        forecast = self._forecast(sim_minutes)
        cop = get_cop()
        cop.weather = WeatherSnapshot(
            condition=forecast.condition,
            rainfall_mm_hr=forecast.rainfall_mm_hr,
            alert_level=forecast.alert_level,
            wind_kmh=forecast.wind_kmh,
            visibility=forecast.visibility,
        )
        update_cop()   # bump last_updated / update_count
        return forecast

    # ── internals ────────────────────────────────────────────────────────────

    @staticmethod
    def _forecast(sim_minutes: int) -> WeatherForecast:
        """Select the appropriate escalation tier for the given time."""
        condition, rainfall, alert, wind = "Heavy Rain", 8.0, "Orange", 25.0
        for threshold, cond, rain, alrt, wnd in _ESCALATION:
            if sim_minutes >= threshold:
                condition, rainfall, alert, wind = cond, rain, alrt, wnd

        visibility = "Poor" if alert == "Red" else "Reduced"
        confidence = 88 if alert == "Red" else 82

        return WeatherForecast(
            condition=condition,
            rainfall_mm_hr=rainfall,
            alert_level=alert,
            wind_kmh=wind,
            visibility=visibility,
            confidence=confidence,
        )


# Module-level singleton
weather_agent = WeatherAgent()
