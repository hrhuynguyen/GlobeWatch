# GlobeWatch

GlobeWatch is a from-scratch 3D humanitarian crisis intelligence platform inspired by Crisis Topography: Command Center. It visualizes crisis severity, people in need, funding gaps, and country-level humanitarian metrics through a cinematic globe interface backed by a FastAPI mock-data API.

The goal is to grow this into an interactive command center where users can explore global crises, inspect country details, compare regions, ask natural-language questions, and eventually add AI, vector search, reports, and voice control.

## Current Status

Implemented:

- Next.js landing page with a clear product pitch and CTA to the globe view.
- `/globe` experience with an interactive 3D globe, severity-colored crisis markers, summary metric cards, and country drilldown panel.
- FastAPI backend with CORS and typed Pydantic responses.
- Sample crisis data loaded from `data/sample/crises.json`.
- Frontend API client that fetches crisis data from the backend at runtime.

Planned:

- Globe modes for severity, funding gap, overlooked crises, and predictive risk.
- Dashboard analytics with charts and top crisis summaries.
- Natural-language query endpoint.
- AI/RAG and vector-search integrations.
- Voice-agent controls and downloadable reports.

## Tech Stack

- Frontend: Next.js, React, TypeScript, Tailwind CSS, Three.js, `react-globe.gl`.
- Backend: FastAPI, Python, Pydantic, Uvicorn.
- Data: local JSON sample data for the MVP.

## Project Structure

```text
.
├── frontend/          # Next.js app
├── backend/           # FastAPI app
├── data/sample/       # Local mock crisis data
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
- Crisis data: `http://localhost:8000/api/globe/crises?year=2024&month=1`

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

The frontend expects the backend at:

```text
NEXT_PUBLIC_API_URL=http://localhost:8000
```

This value is already documented in `.env.example`.

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
