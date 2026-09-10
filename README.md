# 🛰️ Sentinel AI

> **Multi-Agent AI Emergency Command Center** — Real-time disaster response for the Kerala flood scenario using SegFormer, Florence-2, OSMnx, LangGraph, ChromaDB, and a local Qwen 2.5 LLM reasoning layer.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Backend: FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi)](backend/)
[![Frontend: React+Vite](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB?logo=react)](frontend/)
[![Orchestration: LangGraph](https://img.shields.io/badge/Orchestration-LangGraph-FF6B35)](backend/graph/)
[![Vector DB: ChromaDB](https://img.shields.io/badge/VectorDB-ChromaDB-6B4FBB)](backend/services/chroma_store.py)
[![Tests: pytest](https://img.shields.io/badge/Tests-pytest-0A9EDC)](backend/tests/)
[![LLM: Qwen 2.5](https://img.shields.io/badge/LLM-Qwen%202.5%203B-8B5CF6)](backend/agents/reasoning_agent.py)
[![Ollama](https://img.shields.io/badge/Inference-Ollama-000000)](backend/services/ollama_service.py)

---

## What It Does

Sentinel AI fuses multi-source disaster data through a pipeline of six specialized AI agents to produce a **Common Operating Picture (COP)** — a unified, real-time situational awareness dashboard for emergency coordinators.

| Input | Agent | Output |
|---|---|---|
| Satellite imagery | SegFormer + Florence-2 | Flood extent map + scene description |
| Weather data | Weather Agent (OWM / simulation) | Risk escalation scores |
| OSM road network | OSMnx + NetworkX | Passable route graph + ETAs |
| Emergency SOS reports | Emergency Intelligence Agent | Victim priority list |
| All of the above | LangGraph Commander | Rescue priorities + resource allocation + confidence scores + natural-language explanation |
| Commander output + COP | Reasoning Agent (Qwen 2.5 via Ollama) | SITREP · decision explanation · handover briefing · after action report |

---

## Architecture

```
frontend (React + Vite)
    │  REST polling (2–5s)
backend (FastAPI)
    ├── api/              — 40 route handlers across 8 routers
    ├── agents/           — 7 LangGraph agent nodes
    │   ├── vision_agent      SegFormer + Florence-2
    │   ├── emergency_agent   NLP pipeline + ChromaDB
    │   ├── weather_agent     OWM API + simulation fallback
    │   ├── logistics_agent   OSMnx + Dijkstra routing
    │   ├── commander_agent   Evidence fusion + priority scoring
    │   └── reasoning_agent   Qwen 2.5 via Ollama + deterministic fallback
    ├── graph/            — LangGraph StateGraph (7 nodes, sequential)
    ├── services/         — Shared singletons (COP, ChromaDB, OSM, models, Ollama)
    ├── simulation/       — Kerala flood scenario engine (16 events)
    └── utils/            — Logging, startup checks

chroma/                   — ChromaDB persistent vector store
datasets/osm/             — Cached Kerala road network (GraphML)
D:\GOALS\Models\          — Local model weights (SegFormer, Florence-2)
```

### Agent Pipeline
```
Simulation → Weather → Vision → Emergency → Logistics → Commander → Reasoning Agent → Dashboard
```
The Reasoning Agent is the final node. It reads Commander output and COP state, then generates
human-readable narratives. It never makes operational decisions — Commander remains the source of truth.

### COP Architecture Rule
**No agent passes data directly to another.** All inter-agent communication flows through the COP singleton. This enforces clean separation and makes every agent independently testable.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite 5, Leaflet |
| Backend | FastAPI, Uvicorn, Pydantic v2 |
| AI Orchestration | LangGraph 0.2.55 |
| Flood Segmentation | SegFormer (nvidia/segformer-b2) |
| Scene Description | Florence-2 (microsoft/Florence-2-base) |
| Semantic Search | Sentence Transformers (all-MiniLM-L6-v2) |
| Local LLM | Qwen 2.5 3B Instruct via Ollama |
| Road Network | OSMnx 1.9, NetworkX 3.4 |
| Vector Store | ChromaDB 0.5 |
| Weather | OpenWeatherMap API (free tier) |
| Deployment | Vercel (frontend) · Render (backend) |

---

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 20+

### Backend

```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate
# macOS/Linux
source .venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
uvicorn main:app --reload
```

API: `http://localhost:8000`
Health: `GET http://localhost:8000/health`
Detailed: `GET http://localhost:8000/health/detailed`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App: `http://localhost:5173`

---

## Activating the Local LLM (Reasoning Agent)

The Reasoning Agent uses **Qwen 2.5 3B Instruct** running locally via Ollama.
The system works fully without it — all outputs fall back to deterministic templates.

1. Install Ollama from [ollama.com](https://ollama.com)
2. Pull the model:
   ```bash
   ollama pull qwen2.5:3b-instruct
   ```
3. Ollama starts automatically on Windows. Verify:
   ```bash
   ollama list
   # should show qwen2.5:3b-instruct
   ```
4. Check status in the running app:
   ```
   GET http://localhost:8000/api/reasoning/status
   ```

Configure in `.env` (defaults work out of the box):
```
OLLAMA_HOST=http://127.0.0.1:11434
OLLAMA_MODEL=qwen2.5:3b-instruct
```

---

## Activating Real AI Models

By default, Sentinel AI runs in **mock mode** — all AI outputs are deterministic and require no GPU.

To activate real inference:

1. Download model weights:
   ```
   D:\GOALS\Models\SegFormer\    ← nvidia/segformer-b2-finetuned-ade-512-512
   D:\GOALS\Models\Florence-2\   ← microsoft/Florence-2-base
   ```

2. Install vision dependencies:
   ```bash
   pip install transformers==4.44.0 torch==2.4.0 Pillow==10.4.0 numpy==1.26.4 accelerate==0.33.0
   ```

3. Set in `.env`:
   ```
   USE_MOCK_MODELS=false
   ```

Sentence Transformers (`all-MiniLM-L6-v2`) download automatically on first use.

---

## Activating Real GIS Routing

OSMnx downloads the Kerala road network automatically on first use:

```bash
pip install osmnx==1.9.4
```

The graph is cached at `datasets/osm/kerala_drive.graphml` (~50MB). Subsequent starts load from cache instantly. Falls back to static `roads.json` if OSMnx is unavailable.

---

## Activating Live Weather

1. Get a free API key from [openweathermap.org](https://openweathermap.org/api)
2. Set in `.env`:
   ```
   OPENWEATHER_API_KEY=your_key_here
   WEATHER_LIVE=true
   ```

---

## Running Tests

```bash
cd backend
pytest
```

Test coverage:
- `test_api_simulation.py` — simulation control endpoints
- `test_emergency.py` — NLP pipeline, duplicate detection, incident API
- `test_logistics.py` — routing, resource assignment, road closures
- `test_commander.py` — priority engine, evidence fusion, COP
- `test_vision_dashboard.py` — vision analysis, dashboard aggregation
- `test_workflow.py` — full LangGraph end-to-end pipeline
- `test_reasoning.py` — reasoning agent fallback and prompt builder

---

## Project Structure

```
Sentinel-AI/
├── frontend/              # React + Vite SPA
│   ├── src/components/    # 34+ UI components
│   │   ├── SitrepPanel.jsx       # AI Situation Report
│   │   ├── AIExplanationCard.jsx # Commander decision explanation
│   │   ├── HandoverPanel.jsx     # Shift handover briefing
│   │   └── ReportGenerator.jsx  # After Action Report
│   ├── src/context/       # DashboardContext (unified polling hub)
│   └── src/pages/         # Dashboard, Vision, Emergency, Logistics, CommandCenter
├── backend/
│   ├── agents/            # 7 LangGraph agent implementations
│   │   └── reasoning_agent.py  # Qwen 2.5 LLM + deterministic fallback
│   ├── api/               # 8 FastAPI routers (40 endpoints)
│   │   └── reasoning.py        # /api/reasoning/* (5 endpoints)
│   ├── graph/             # LangGraph StateGraph (7 nodes)
│   ├── services/          # COP, ChromaDB, OSMnx, models, Ollama
│   │   ├── ollama_service.py   # Ollama HTTP client with retry/fallback
│   │   └── prompt_builder.py   # COP-grounded prompt templates
│   ├── simulation/        # Kerala flood scenario engine
│   ├── tests/             # pytest test suite
│   └── utils/             # Logging, startup checks
├── datasets/osm/          # Cached Kerala road network
├── chroma/                # ChromaDB persistent store (gitignored)
├── docs/
│   ├── architecture/      # System design documentation
│   └── api/               # API reference
├── render.yaml            # Render deployment config
└── frontend/vercel.json   # Vercel deployment config
```

---

## Deployment

### Backend → Render
1. Connect GitHub repo to Render
2. Select `render.yaml` (auto-detected)
3. Set secret env vars in Render dashboard: `OPENWEATHER_API_KEY`, `FRONTEND_URL`
   > Note: Ollama runs locally only — the Reasoning Agent uses deterministic fallback on Render.
4. Deploy

### Frontend → Vercel
1. Connect GitHub repo to Vercel
2. Set root directory to `frontend/`
3. Set `VITE_API_URL` to your Render backend URL
4. Deploy

---

## Roadmap

- [x] Repository foundation & project structure
- [x] FastAPI backend with CORS + health endpoints
- [x] React + Vite frontend with Leaflet map
- [x] Kerala flood simulation engine (16 events)
- [x] Vision Agent (SegFormer + Florence-2 interfaces)
- [x] Emergency Intelligence Agent (NLP pipeline)
- [x] Logistics Agent (graph routing + resource management)
- [x] Commander Agent (LangGraph orchestration + COP)
- [x] Unified Command Center Dashboard
- [x] Real model integration (SegFormer, Florence-2, SentenceTransformers)
- [x] OSMnx real GIS routing with fallback
- [x] ChromaDB persistent incident memory
- [x] Live weather API integration
- [x] Centralized logging + startup checks
- [x] Production pytest test suite (54 tests)
- [x] Render + Vercel deployment configs
- [x] Architecture + API documentation
- [x] Local LLM Reasoning Agent (Qwen 2.5 3B via Ollama)
- [x] SITREP, decision explanation, handover, and AAR generation
- [x] Graceful fallback to deterministic templates when Ollama is offline
- [x] Hybrid agentic AI system (deterministic Commander + generative Reasoning)

---

## Documentation

- [Architecture](docs/architecture/ARCHITECTURE.md) — System design, agent pipeline, data flow
- [API Reference](docs/api/API.md) — All 35 endpoints documented

---

## Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Commit: `git commit -m "feat: description"`
4. Push and open a Pull Request

---

## License

[MIT](LICENSE) © 2025 Sentinel AI Contributors
