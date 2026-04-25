# GlobeWatch

GlobeWatch is a from-scratch 3D humanitarian crisis intelligence platform inspired by Crisis Topography: Command Center. It visualizes crisis severity, people in need, funding gaps, and country-level humanitarian metrics through a cinematic globe interface backed by a FastAPI API.

The goal is to grow this into an interactive command center where users can explore global crises, inspect country details, compare regions, ask natural-language questions, and eventually add AI, vector search, reports, and voice control.

## Current Status

Implemented:

- Next.js landing page with a clear product pitch and CTA to the globe view.
- `/globe` experience with an interactive 3D globe, severity-colored crisis markers, summary metric cards, and country drilldown panel.
- FastAPI backend with CORS and typed Pydantic responses.
- Live-data ingestion from OCHA HPC/FTS and World Bank population data, normalized into `Country`, `Crisis`, `Project`, and `GlobeSnapshot` models.
- Processed 2026 crisis snapshot loaded from `data/processed/globe_snapshot_2026.json`, with fallback sample data in `data/sample/crises.json`.
- Frontend API client that fetches crisis data from the backend at runtime.
- Globe modes for severity, funding gap, overlooked crises, and predictive risk.
- `/dashboard` analytics view with API-backed cards, funding trend, underfunded-country rankings, and cluster distribution.
- `/api/ask` natural-language query layer with rule-based metric answers plus grounded RAG for open-ended questions.
- Phase 7 AI endpoints for semantic benchmarking and predictive risk signals.

Planned:

- Voice-agent controls and downloadable reports.

## Tech Stack

- Frontend: Next.js, React, TypeScript, Tailwind CSS, Three.js, `react-globe.gl`.
- Backend: FastAPI, Python, Pydantic, Uvicorn, HTTPX.
- Data: OCHA HPC/FTS, World Bank population API, processed JSON snapshots, and local sample fallback data.

## Project Structure

```text
.
├── frontend/          # Next.js app
├── backend/           # FastAPI app
├── data/raw/          # Raw API responses from ingestion
├── data/processed/    # Normalized app-ready snapshots
├── data/sample/       # Local fallback crisis data
├── build_plan.md      # Phase-by-phase implementation plan
├── summary.md         # Repo/product summary
└── .env.example       # Environment variable reference
```

## Run Locally

### 1. Backend

```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

Backend URLs:

- API health: `http://localhost:8000/api/health`
- API docs: `http://localhost:8000/docs`
- Crisis data: `http://localhost:8000/api/globe/crises?year=2026&month=4`
- Country projects: `http://localhost:8000/api/globe/projects?iso3=SDN`
- Dashboard summary: `http://localhost:8000/api/dashboard/summary?year=2026&month=4`
- Natural-language query: `POST http://localhost:8000/api/ask`
- Semantic benchmark: `POST http://localhost:8000/api/benchmark`
- Predictive risks: `POST http://localhost:8000/api/predictive/risks`

If the virtual environment does not exist yet:

```bash
cd ..
python -m venv backend/venv
source backend/venv/bin/activate
pip install -r backend/requirements.txt
```

### 2. Frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend URLs:

- Landing page: `http://localhost:3000`
- Globe page: `http://localhost:3000/globe`
- Dashboard page: `http://localhost:3000/dashboard`

The frontend expects the backend at:

```text
NEXT_PUBLIC_API_URL=http://localhost:8000
```

This value is already documented in `.env.example`.

AI/RAG settings are optional. By default, GlobeWatch uses local sparse embeddings and deterministic fallback answers. To enable Gemini synthesis for grounded RAG answers, set `LLM_PROVIDER=gemini` and provide `GEMINI_API_KEY`:

```text
LLM_PROVIDER=rule-based
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash
EMBEDDING_PROVIDER=local-sparse
VECTOR_STORE=local-memory
```

Voice settings are also optional. The Phase 8 voice agent uses browser push-to-talk and text fallback by default. For the low-latency Gemini Live path, keep the API key on the backend and set:

```bash
VOICE_PROVIDER=gemini-live
GEMINI_API_KEY=your_key_here
GEMINI_LIVE_MODEL=gemini-3.1-flash-live-preview
```

## Refresh Live Data

The current snapshot was generated from public OCHA HPC/FTS 2026 data and World Bank population data. To refresh it:

```bash
cd backend
source venv/bin/activate
python -m app.jobs.ingest_live_data --year 2026 --month 4 --limit 12
```

This writes raw API responses to `data/raw/` and the normalized globe dataset to `data/processed/globe_snapshot_2026.json`.

## Build Check

```bash
cd frontend
npm run build
```

For backend import/schema checks:

```bash
cd backend
source venv/bin/activate
python -m compileall app
```
