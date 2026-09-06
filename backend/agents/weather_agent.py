"""Weather Agent — real + simulation weather provider.

Priority:
  1. Live OpenWeatherMap data (when OPENWEATHER_API_KEY is set and WEATHER_LIVE=true)
  2. Simulation escalation table (deterministic, always available)

The COP write interface is unchanged — other agents are unaffected.
"""
from dataclasses import dataclass

from services.cop_manager import WeatherSnapshot, get_cop, update_cop

_ESCALATION: list[tuple[int, str, float, str, float]] = [
    (540,  "Heavy Rain",    8.0,  "Orange", 25.0),
    (645,  "Heavy Rain",   12.0,  "Orange", 30.0),
    (660,  "Extreme Rain", 20.0,  "Red",    40.0),
    (750,  "Extreme Rain", 28.0,  "Red",    50.0),
    (870,  "Extreme Rain", 35.0,  "Red",    55.0),
]


@dataclass
class WeatherForecast:
    condition: str
    rainfall_mm_hr: float
    alert_level: str
    wind_kmh: float
    visibility: str
    confidence: int
    source: str = "simulation"


class WeatherAgent:
    """Stateless weather agent. Call .update(sim_minutes) each orchestration cycle."""

    def update(self, sim_minutes: int) -> WeatherForecast:
        """Produce a weather forecast and write it to the COP.

        Args:
            sim_minutes: Current simulation time in minutes since midnight.

        Returns:
            WeatherForecast snapshot.
        """
        forecast = self._get_forecast(sim_minutes)
        cop = get_cop()
        cop.weather = WeatherSnapshot(
            condition=forecast.condition,
            rainfall_mm_hr=forecast.rainfall_mm_hr,
            alert_level=forecast.alert_level,
            wind_kmh=forecast.wind_kmh,
            visibility=forecast.visibility,
        )
        update_cop()
        return forecast

    @staticmethod
    def _get_forecast(sim_minutes: int) -> WeatherForecast:
        """Try live weather first, fall back to simulation escalation table."""
        try:
            from services.weather_service import fetch_kerala_weather
            live = fetch_kerala_weather()
            if live is not None:
                return WeatherForecast(
                    condition=live.condition,
                    rainfall_mm_hr=live.rainfall_mm_hr,
                    alert_level=live.alert_level,
                    wind_kmh=live.wind_kmh,
                    visibility=live.visibility,
                    confidence=live.confidence,
                    source="live",
                )
        except Exception:
            pass

        return WeatherAgent._sim_forecast(sim_minutes)

    @staticmethod
    def _sim_forecast(sim_minutes: int) -> WeatherForecast:
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
            source="simulation",
        )


weather_agent = WeatherAgent()
