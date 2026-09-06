# Sentinel AI — Architecture Documentation

## System Overview

Sentinel AI is a multi-agent disaster response platform that fuses satellite imagery, weather forecasts, road network data, and emergency SOS reports into a **Common Operating Picture (COP)** — a unified, real-time situational awareness dashboard for emergency coordinators.

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (React + Vite)                   │
│  DashboardShell · MapView · COPPanel · RescueQueue · AlertCenter │
└────────────────────────────┬────────────────────────────────────┘
                             │ REST / JSON (polling 2–5s)
┌────────────────────────────▼────────────────────────────────────┐
│                      FastAPI Backend                             │
│  /api/dashboard  /api/commander  /api/logistics  /api/emergency  │
│  /api/vision     /api/simulation  /api/map                       │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                   LangGraph Orchestrator                         │
│  simulation → weather → vision → emergency → logistics →         │
│  commander → END                                                 │
└────────────────────────────┬────────────────────────────────────┘
                             │ All agents read/write COP
┌────────────────────────────▼────────────────────────────────────┐
│              Common Operating Picture (COP)                      │
│  weather · flood · incidents · resources · routes · closures     │
└─────────────────────────────────────────────────────────────────┘
```

---

## COP Architecture Rule

**No agent passes data directly to another agent.** All inter-agent communication flows through the COP singleton. This enforces clean separation of concerns and makes each agent independently testable.

---

## Multi-Agent Pipeline

| Agent | Input | Output to COP |
|---|---|---|
| Simulation | Timeline JSON | `sim_time`, `sim_minutes`, `active_events` |
| Weather | Sim time / OWM API | `cop.weather` (WeatherSnapshot) |
| Vision | Image bytes (async) | `cop.flood` (FloodSnapshot) |
| Emergency | Raw SOS text | `cop.incidents` (list[IncidentSnapshot]) |
| Logistics | Graph + events | `cop.resources`, `cop.routes`, `cop.road_closures` |
| Commander | Full COP (read-only) | `cop.priority_zone`, `cop.priority_score` + recommendations |

### LangGraph Node Sequence

```
node_simulation  →  Sync clock from SimulationState → COP
node_weather     →  Run WeatherAgent.update() → COP.weather
node_vision      →  Read vision_cop_bridge cache → COP.flood
node_emergency   →  Sync incident_store → COP.incidents
node_logistics   →  Sync ResourceManager + RouteReplanner → COP
node_commander   →  Read COP → rank → fuse → recommend → log
```

Each node is a pure function `(AgentState) -> AgentState`. Errors are caught per-node and appended to `state["errors"]` — a single node failure never crashes the pipeline.

---

## Vision Pipeline

### SegFormer (Flood Segmentation)
1. Image bytes → PIL Image
2. SegformerImageProcessor → tensor inputs
3. SegformerForSemanticSegmentation → logit map
4. Upsample to original resolution
5. Argmax → per-pixel class labels
6. Count water-class pixels (ADE20K: water=21, sea=26, river=60)
7. Coverage % → risk level → SegmentationResult

**Fallback**: Deterministic mock based on MD5 hash of first 512 bytes.

### Florence-2 (Scene Description)
1. Image bytes → PIL Image
2. AutoProcessor with `<DETAILED_CAPTION>` task prompt
3. AutoModelForCausalLM.generate() → token IDs
4. post_process_generation() → caption string
5. Parse caption → key observations, infrastructure status, civilian presence

**Fallback**: Curated bank of 5 realistic Kerala flood descriptions, selected by hash.

---

## Logistics Pipeline

### Road Graph
- **Primary**: OSMnx downloads Kerala drive network from OpenStreetMap, cached as `datasets/osm/kerala_drive.graphml`
- **Fallback**: Static `simulation/roads.json` (12 nodes, 16 edges)
- Routing: NetworkX `shortest_path(weight="travel_time")` on OSM graph; custom Dijkstra on static graph

### Resource Assignment
1. `nearest_available()` — straight-line distance from resource location to destination
2. Type preference: flood → Boat, hospital → Ambulance
3. `create_assignment()` → ETA calculation → RouteReplanner stores assignment
4. On `road_blocked` event: `replan_all()` recalculates all affected routes

---

## Commander Decision Engine

### Priority Formula
```
P = 0.35·S + 0.20·Pop + 0.20·A + 0.15·W + 0.10·R
```

| Factor | Description | Range |
|---|---|---|
| S (Severity) | Max severity score of incidents at location | 0–100 |
| Pop (Population) | People count + facility type bonus | 0–100 |
| A (Accessibility) | Inverse accessibility (closures + delays) | 0–100 |
| W (Weather) | Alert level score (Green=10, Red=100) | 0–100 |
| R (Resource) | Inverse resource availability | 0–100 |

### Evidence Fusion
```
Fused Confidence = Σ(source_weight × source_confidence)
```

| Source | Weight |
|---|---|
| Logistics | 35% |
| Emergency | 30% |
| Vision | 20% |
| Weather | 15% |

### Confidence Breakdown
```
Overall = 0.50 × evidence_confidence
        + 0.30 × priority_certainty
        + 0.20 × data_completeness
```

---

## ChromaDB Incident Memory

- Collection: `incidents`
- Embedding: `all-MiniLM-L6-v2` (sentence-transformers, 384-dim)
- Distance: cosine similarity
- Persistence: `chroma/` directory (gitignored, survives restarts)
- Semantic search: `incident_store.semantic_search(query, n=5)`
- Duplicate detection: cosine similarity ≥ 0.82 within 30-minute window

---

## Simulation Engine

- Virtual clock: 09:00 → 14:30 (330 minutes)
- Tick rate: 1 real second = 1 virtual minute (× speed multiplier)
- Speed multipliers: 1×, 2×, 5×
- 16 timeline events: weather, flood, road_blocked, hospital_sos, rescue, shelter_capacity, resource_deploy
