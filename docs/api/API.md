# Sentinel AI — API Reference

Base URL: `http://localhost:8000` (dev) · `https://sentinel-ai-backend.onrender.com` (prod)

---

## Health

### `GET /health`
Basic liveness check.
```json
{ "status": "ok", "service": "sentinel-ai-backend", "version": "1.0.0" }
```

### `GET /health/detailed`
Full service availability report including model status, ChromaDB, OSM cache, and weather API.

---

## Simulation — `/api/simulation`

### `GET /state`
Current simulation state including time, progress, active events, and location overrides.

### `GET /timeline`
All 16 timeline events (09:00 → 14:30).

### `POST /play` · `POST /pause` · `POST /reset`
Control simulation playback.

### `POST /step`
Advance exactly 1 virtual minute.

### `POST /speed`
```json
{ "speed": 2 }   // 1 | 2 | 5
```

---

## Vision — `/api/vision`

### `POST /analyze`
Upload an image for flood analysis.
- Content-Type: `multipart/form-data`
- Field: `file` (JPEG/PNG/WebP/TIFF, max 20MB)

Response:
```json
{
  "image_hash": "abc123",
  "analysis": {
    "flood_detected": true,
    "coverage_percent": 54,
    "risk_level": "High",
    "affected_zones": ["River banks"],
    "water_depth_estimate": "moderate",
    "model_used": "mock-segformer-v0"
  },
  "scene_description": {
    "caption": "...",
    "key_observations": [...],
    "infrastructure_status": "...",
    "civilian_presence": "...",
    "model_used": "mock-florence2-v0"
  },
  "confidence": { "segmentation": 82, "scene": 78, "overall": 80 }
}
```

### `GET /health`
Model load status.

---

## Emergency — `/api/emergency`

### `POST /report`
Submit an emergency SOS report.
```json
{ "text": "Flooding at Alappuzha Medical Center. 80 patients trapped." }
```
Response: Full `Incident` object with extracted entities, severity, and confidence.

### `GET /incidents`
Query parameters: `severity` (Critical/High/Medium/Low), `status` (Open/Acknowledged/Resolved), `limit`.

### `GET /incidents/{id}`
Single incident by ID.

### `PATCH /incidents/{id}/status`
```json
{ "status": "Acknowledged" }
```

### `POST /mock`
Load pre-seeded Kerala flood reports.

---

## Logistics — `/api/logistics`

### `GET /resources`
All 10 rescue assets with current status.

### `GET /routes`
All active route assignments.

### `GET /network`
Road graph: nodes (12) + edges (16) with current blocked status.

### `POST /assign`
```json
{ "destination": "Alappuzha", "resource_type": "Boat" }
```

### `POST /recalculate`
Force-recompute all active route assignments.

### `POST /event`
Inject a simulation event.
```json
{ "event_type": "road_blocked", "location": "Alappuzha", "event_id": 3 }
```

### `POST /reset`
Clear all assignments and road closures.

---

## Commander — `/api/commander`

### `GET /cop`
Full Common Operating Picture snapshot.

### `GET /recommendations`
Last computed rescue recommendations (up to 3).

### `GET /decision-log`
Chronological log of all Commander decisions.

### `POST /recompute`
Run a full Commander decision cycle. Returns recommendations + confidence breakdown.

### `POST /reset`
Clear decision log and reset COP.

---

## Dashboard — `/api/dashboard`

### `GET /state`
Unified snapshot: sim + COP + resources + routes + road closures + network.
Polled every 2s by the main dashboard.

### `GET /events`
Merged activity feed from all sources (simulation, emergency, logistics, commander).
Sorted newest-first, capped at 50. Polled every 3s.

### `GET /alerts`
Active high-priority alerts only (Critical/High incidents, road closures, blocked routes, Red weather).
Polled every 3s.

---

## Map — `/api/map`

### `GET /locations`
All 10 Kerala locations with coordinates, status, and metadata.
