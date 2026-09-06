# Sentinel AI — Interview Preparation Guide

## STAR Project Explanation (2–3 minutes)

**Situation**: Emergency coordinators during the 2018 Kerala floods had to manually correlate satellite imagery, weather alerts, road closure reports, and SOS calls — often from different systems with no unified view. This fragmented picture led to delayed rescue prioritization.

**Task**: Build a production-grade AI system that automatically fuses multi-source disaster data into a single Common Operating Picture with explainable rescue priorities.

**Action**: Designed and built Sentinel AI — a multi-agent system using LangGraph orchestration where six specialized agents (simulation, weather, vision, emergency, logistics, commander) each contribute to a shared COP. The Commander agent fuses evidence from all sources using a weighted priority formula and generates natural-language explanations for every recommendation.

**Result**: A fully functional end-to-end system with real AI model integration (SegFormer flood segmentation, Florence-2 scene description, SentenceTransformer semantic search), real GIS routing via OSMnx, persistent ChromaDB incident memory, and a live React dashboard — deployable to Render + Vercel.

---

## System Design Explanation (10 minutes)

### Why LangGraph?
LangGraph provides a typed state machine for multi-agent orchestration. Each node is a pure function that reads/writes a shared `AgentState` dict. This gives us:
- **Deterministic execution order**: simulation → weather → vision → emergency → logistics → commander
- **Error isolation**: each node catches its own exceptions, appending to `state["errors"]`
- **Testability**: any node can be called directly with a minimal state dict
- **Future extensibility**: add parallel branches (e.g., satellite + weather simultaneously) by changing edges

### Why COP as shared state?
The COP (Common Operating Picture) is the single source of truth. The architecture rule — **no agent passes data directly to another** — enforces clean separation. Benefits:
- Any agent can be replaced without touching others
- The Commander always has a consistent snapshot
- The frontend only needs one endpoint (`/api/dashboard/state`) for the full picture

### Why ChromaDB?
- Persistent across restarts (unlike in-memory list)
- Semantic search enables "find incidents similar to this report" — critical for duplicate detection and historical retrieval
- Cosine similarity on sentence embeddings catches paraphrased duplicates that keyword matching misses

### Why OSMnx over a static graph?
- Real road network with actual travel times from OpenStreetMap
- Automatic speed estimation per road type
- One-time download, cached as GraphML — no repeated API calls
- Falls back to static `roads.json` if OSMnx is unavailable

---

## Architecture Decisions & Trade-offs

| Decision | Alternative | Reason |
|---|---|---|
| LangGraph sequential pipeline | Parallel async agents | Simpler debugging; agents have data dependencies (commander needs all others) |
| COP singleton | Message passing / event bus | Simpler state management; no serialization overhead |
| Mock models with real interfaces | No mock mode | Enables development without GPU; same code path for real inference |
| ChromaDB + in-memory dual store | ChromaDB only | In-memory gives O(1) API access; ChromaDB gives persistence + semantic search |
| OSMnx with static fallback | Static graph only | Real routing when available; always works without network |
| Polling (2–5s) | WebSockets | Simpler deployment; acceptable latency for disaster response (not millisecond-critical) |
| Deterministic priority formula | ML-based ranking | Explainable; auditable; no training data required; weights are configurable |

---

## Scaling Strategy

### Horizontal scaling
- FastAPI is stateless except for in-memory singletons
- Move COP to Redis for multi-instance deployments
- Move incident store to PostgreSQL + pgvector for distributed semantic search

### Model serving
- Move SegFormer + Florence-2 to a dedicated inference service (Triton, TorchServe)
- Use async HTTP calls from the vision agent
- Cache inference results by image hash

### Real-time updates
- Replace polling with WebSocket push from the simulation engine
- Use Server-Sent Events (SSE) for the activity feed

### Data pipeline
- Replace simulation engine with real satellite imagery ingestion (NASA FIRMS, Sentinel-2)
- Add IMD (India Meteorological Department) API for real Kerala weather
- Integrate NDRF (National Disaster Response Force) resource tracking API

---

## Likely Interview Questions

**Q: How does the Commander decide which location to prioritize?**
A: It uses a weighted formula: P = 0.35·Severity + 0.20·Population + 0.20·Accessibility + 0.15·Weather + 0.10·Resource. Each factor is computed from COP data — severity from incident scores, accessibility from road closures and route delays, weather from the alert level. All weights are configurable in `priority_engine.py`.

**Q: How do you handle a model being unavailable?**
A: Every model load is wrapped in try/except. If SegFormer fails to load, `run_segmentation()` falls back to deterministic mock output. If Florence-2 fails, `run_scene_description()` returns a curated description. The application never crashes due to model unavailability.

**Q: How does duplicate detection work?**
A: Two-tier approach. First, SentenceTransformer encodes the new report and all recent reports (within 30 minutes) into 384-dim embeddings, then computes cosine similarity. If similarity ≥ 0.82, it's a duplicate. If the model is unavailable, it falls back to weighted keyword matching (location 40%, incident type 35%, facility 25%).

**Q: Why not use a database for incidents?**
A: We do — ChromaDB is a vector database. The in-memory list is a read-through cache for fast API access. ChromaDB persists across restarts and enables semantic search. For production at scale, we'd add PostgreSQL for structured queries alongside ChromaDB for vector search.

**Q: How would you add a new agent?**
A: 1) Create `agents/new_agent.py` with a singleton that writes to COP. 2) Add a node function in `graph/nodes.py`. 3) Add the node and edge to `graph/workflow.py`. 4) Add the relevant COP fields to `services/cop_manager.py`. No other files need to change.

**Q: What's the confidence score?**
A: It's a three-component weighted score: evidence confidence (50%) from the weighted average of per-source confidences, priority certainty (30%) from the gap between rank-1 and rank-2 scores, and data completeness (20%) from the fraction of COP layers with meaningful data. This gives coordinators a quantified measure of how much to trust the recommendation.

---

## Key Numbers to Remember
- 6 agents in the LangGraph pipeline
- 5 priority factors, weights sum to 1.0
- 4 evidence sources (logistics 35%, emergency 30%, vision 20%, weather 15%)
- 3 confidence components (evidence 50%, certainty 30%, completeness 20%)
- 12 Kerala nodes, 16 road edges in static graph
- 10 rescue assets (3 boats, 3 ambulances, 2 helicopters, 2 trucks)
- 16 simulation timeline events (09:00 → 14:30)
- 35 API endpoints across 7 routers
