# 🛰️ Sentinel AI

> **Multi-Agent Disaster Response System** — Satellite imagery · Weather forecasts · Road networks · Emergency SOS → Common Operating Picture with explainable rescue priorities.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Backend: FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi)](backend/)
[![Frontend: React+Vite](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB?logo=react)](frontend/)

---

## What It Does

Sentinel AI fuses multi-source disaster data through a pipeline of specialized AI agents to produce a **Common Operating Picture (COP)**:

| Input | Agent | Output |
|---|---|---|
| Satellite imagery | SegFormer / Florence-2 | Flood extent, damage map |
| Weather forecasts | Weather Agent | Risk escalation scores |
| OSM road network | OSMnx + NetworkX | Passable route graph |
| Emergency SOS reports | Triage Agent | Victim priority list |
| All of the above | LangGraph Orchestrator | Rescue priorities + resource allocation + confidence scores + natural-language explanation |

---

## Architecture

```
frontend (React + Vite)
    │  REST / WebSocket
backend (FastAPI)
    ├── api/          — route handlers
    ├── agents/       — LangGraph agent nodes
    ├── services/     — external API clients (weather, satellite, OSM)
    ├── simulation/   — synthetic disaster scenario generator
    ├── models/       — Pydantic schemas
    ├── utils/        — shared helpers
    └── state.py      — AgentState (shared graph state)

chroma/               — vector store (ChromaDB)
datasets/             — Kerala flood, FloodNet, OSM extracts
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite 5 |
| Backend | FastAPI, Uvicorn, Pydantic v2 |
| AI Orchestration | LangGraph |
| Segmentation | SegFormer, Florence-2 |
| Road Network | OSMnx, NetworkX |
| Vector Store | ChromaDB |
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

API available at `http://localhost:8000`
Health check: `GET http://localhost:8000/health`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App available at `http://localhost:5173`

---

## Project Structure

```
Sentinel-AI/
├── frontend/          # React + Vite SPA
├── backend/           # FastAPI application
├── datasets/          # Raw geospatial & flood datasets
├── chroma/            # ChromaDB vector store (gitignored)
├── docs/              # Architecture diagrams, API docs, setup guides
└── tests/             # Integration & E2E tests
```

---

## Roadmap

- [x] Repository foundation & project structure
- [x] FastAPI backend with CORS + `/health` endpoint
- [x] React + Vite frontend placeholder
- [ ] AgentState schema + LangGraph graph skeleton
- [ ] Satellite imagery ingestion (SegFormer)
- [ ] Weather risk agent
- [ ] OSM road network agent
- [ ] SOS triage agent
- [ ] COP dashboard with live map
- [ ] Confidence-based explainability panel
- [ ] Render + Vercel deployment

---

## Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Commit your changes: `git commit -m "feat: description"`
4. Push and open a Pull Request

---

## License

[MIT](LICENSE) © 2025 Sentinel-AI Contributors
