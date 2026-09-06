"""Weather API service.

Wraps OpenWeatherMap (free tier) for real Kerala weather data.
Falls back to the simulation escalation table when:
  - OPENWEATHER_API_KEY is not set
  - The API call fails
  - APP_ENV=development (unless WEATHER_LIVE=true overrides)

Usage:
  Set OPENWEATHER_API_KEY in .env to activate live weather.
  Set WEATHER_LIVE=true to force live weather even in development.
"""
import logging
import os
import time
from dataclasses import dataclass

import httpx

logger = logging.getLogger(__name__)

_API_KEY = os.getenv("OPENWEATHER_API_KEY", "")
_APP_ENV = os.getenv("APP_ENV", "development")
_WEATHER_LIVE = os.getenv("WEATHER_LIVE", "false").lower() == "true"

# Kerala centroid for weather queries
_KERALA_LAT = 10.8505
_KERALA_LON = 76.2711

# Cache: avoid hammering the API (TTL = 10 minutes)
_cache: dict = {}
_cache_ts: float = 0.0
_CACHE_TTL = 600


@dataclass
class LiveWeather:
    condition: str
    rainfall_mm_hr: float
    alert_level: str
    wind_kmh: float
    visibility: str
    confidence: int
    source: str   # "live" | "mock"


def fetch_kerala_weather() -> LiveWeather | None:
    """Fetch current Kerala weather from OpenWeatherMap.

    Returns LiveWeather or None if unavailable / not configured.
    """
    if not _API_KEY:
        return None
    if _APP_ENV == "development" and not _WEATHER_LIVE:
        return None

    global _cache, _cache_ts
    now = time.time()
    if _cache and (now - _cache_ts) < _CACHE_TTL:
        return _cache.get("weather")

    try:
        url = "https://api.openweathermap.org/data/2.5/weather"
        params = {
            "lat": _KERALA_LAT,
            "lon": _KERALA_LON,
            "appid": _API_KEY,
            "units": "metric",
        }
        with httpx.Client(timeout=5.0) as client:
            resp = client.get(url, params=params)
            resp.raise_for_status()
            data = resp.json()

        weather = _parse_owm(data)
        _cache = {"weather": weather}
        _cache_ts = now
        logger.info("Live weather fetched: %s %.1fmm/hr", weather.condition, weather.rainfall_mm_hr)
        return weather

    except Exception as exc:
        logger.warning("Weather API call failed (%s) — using simulation fallback", exc)
        return None


def _parse_owm(data: dict) -> LiveWeather:
    """Parse OpenWeatherMap response into LiveWeather."""
    main = data.get("weather", [{}])[0]
    condition_id = main.get("id", 800)
    description = main.get("description", "Clear").title()

    wind_ms = data.get("wind", {}).get("speed", 0.0)
    wind_kmh = round(wind_ms * 3.6, 1)

    # Rain volume (last 1h, mm)
    rain_mm = data.get("rain", {}).get("1h", 0.0)

    # Visibility (metres → label)
    vis_m = data.get("visibility", 10000)
    if vis_m < 1000:
        visibility = "Very Poor"
    elif vis_m < 4000:
        visibility = "Poor"
    elif vis_m < 7000:
        visibility = "Reduced"
    else:
        visibility = "Good"

    # Alert level from condition ID
    # 2xx = thunderstorm, 3xx = drizzle, 5xx = rain, 6xx = snow, 7xx = atmosphere
    if condition_id < 300:
        alert_level = "Red"
        confidence = 92
    elif condition_id < 400:
        alert_level = "Yellow"
        confidence = 85
    elif condition_id < 600:
        if rain_mm > 15:
            alert_level = "Red"
        elif rain_mm > 7:
            alert_level = "Orange"
        else:
            alert_level = "Yellow"
        confidence = 90
    elif condition_id < 700:
        alert_level = "Orange"
        confidence = 88
    elif condition_id < 800:
        alert_level = "Yellow"
        confidence = 80
    else:
        alert_level = "Green"
        confidence = 95

    return LiveWeather(
        condition=description,
        rainfall_mm_hr=rain_mm,
        alert_level=alert_level,
        wind_kmh=wind_kmh,
        visibility=visibility,
        confidence=confidence,
        source="live",
    )
