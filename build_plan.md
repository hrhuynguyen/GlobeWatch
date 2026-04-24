# From-Scratch Build Plan: 3D Crisis Intelligence Platform

## Product Goal

Build a web platform similar to Crisis Topography: an interactive 3D globe that visualizes humanitarian crises, funding gaps, and predicted risks. Users should be able to explore countries, inspect crisis metrics, ask natural-language questions, and optionally control the experience through a voice agent.

## Progress Legend

- [x] Finished
- [ ] Not finished

## Recommended Stack

- **Frontend:** Next.js, React, TypeScript, Tailwind CSS, Three.js or globe.gl, Framer Motion, Recharts.
- **Backend:** FastAPI, Python, Pydantic, httpx, pandas.
- **Data:** Start with local CSV/JSON sample data, then connect Databricks/Postgres/vector search later.
- **AI:** Start with text query stubs, then add RAG, natural-language SQL, predictive analysis, and voice.
- **Deployment:** Vercel for frontend, Render/Fly.io/Vultr/AWS for backend.

## Initial Folder Architecture

```text
.
├── frontend/
│   ├── public/
│   └── src/
│       ├── app/
│       ├── components/
│       │   ├── dashboard/
│       │   ├── globe/
│       │   └── landing/
│       ├── context/
│       ├── lib/
│       └── types/
├── backend/
│   ├── app/
│   │   ├── core/
│   │   ├── models/
│   │   ├── routers/
│   │   ├── schemas/
│   │   └── services/
│   └── tests/
├── data/
│   ├── raw/
│   ├── processed/
│   └── sample/
├── docs/
├── infra/
├── scripts/
├── .env.example
├── build_plan.md
└── scratch_build_plan.md
```

## Init Commands

Use these commands when creating the real app code.

```bash
# Frontend
npx create-next-app@latest frontend --typescript --tailwind --eslint --app --src-dir
cd frontend
npm install three globe.gl react-globe.gl framer-motion recharts lucide-react

# Backend
cd ..
python -m venv backend/venv
source backend/venv/bin/activate
pip install fastapi uvicorn[standard] pydantic-settings python-dotenv httpx pandas
pip freeze > backend/requirements.txt
```

If the folder skeleton already exists, run the framework init commands carefully or create the app in a temp folder and move generated files into place.

## Phase 1: Static MVP

Status: [x] Finished

Build the first visible version without backend dependencies.

1. [x] Create a landing page with a clear product pitch, feature sections, and a CTA to `/globe`.
2. [x] Create a `/globe` route with a 3D globe, static country markers, and basic orbit controls.
3. [x] Add mock crisis data in `data/sample/crises.json`.
4. [x] Render countries or points with severity colors.
5. [x] Add a side panel that shows selected-country details.

MVP exit criteria:

- [x] `npm run dev` starts the frontend.
- [x] `/` and `/globe` load.
- [x] Globe renders mock data.
- [x] Clicking a country or marker updates the detail panel.

## Phase 2: Backend API

Status: [x] Finished

Create a FastAPI backend that serves the same mock data.

1. [x] Add `backend/app/main.py` with FastAPI app setup and CORS.
2. [x] Add `backend/app/routers/health.py`.
3. [x] Add `backend/app/routers/globe.py`.
4. [x] Add `backend/app/services/data_loader.py` to read sample JSON/CSV.
5. [x] Add typed response schemas in `backend/app/schemas/`.

Initial endpoints:

```text
GET /api/health
GET /api/globe/crises?year=2024&month=1
GET /api/globe/countries/{iso3}
GET /api/globe/projects?iso3=SDN
```

MVP exit criteria:

- [x] `uvicorn app.main:app --reload --port 8000` starts.
- [x] API docs load at `http://localhost:8000/docs`.
- [x] Frontend fetches crisis data from backend instead of local mock data.

## Phase 3: Globe Experience

Status: [ ] Not finished

Turn the globe into the core product experience.

1. [ ] Add view modes: `severity`, `funding-gap`, `overlooked`, `predictive-risk`.
2. [ ] Add color scales and legends for each mode.
3. [ ] Add country selection, hover spotlighting, and camera fly-to behavior.
4. [ ] Add timeline filters for year and month.
5. [ ] Add comparison mode that draws arcs between two countries.

MVP exit criteria:

- [ ] Users can switch map modes.
- [ ] Users can filter by time.
- [ ] Users can compare two countries visually.
- [ ] Empty/loading/error states are visible and understandable.

## Phase 4: Data Model

Status: [ ] Not finished

Define the core data model before adding external data systems.

Core entities:

```text
Country
- iso3
- country_name
- lat
- lng
- population

Crisis
- crisis_id
- iso3
- crisis_name
- year
- month
- severity_score
- severity_class
- people_in_need
- funding_requested_usd
- funding_received_usd
- funding_gap_usd
- coverage_ratio
- oversight_score

Project
- project_id
- project_code
- iso3
- project_name
- cluster
- requested_funds
- target_beneficiaries
- b2b_ratio
- cost_per_beneficiary
- anomaly_score
```

Derived metrics:

```text
funding_gap_usd = funding_requested_usd - funding_received_usd
coverage_ratio = funding_received_usd / funding_requested_usd
funding_per_capita = funding_received_usd / people_in_need
b2b_ratio = target_beneficiaries / requested_funds
oversight_score = weighted combination of high severity, low coverage, and low media/funding attention
```

## Phase 5: Analytics Dashboard

Status: [ ] Not finished

Add a dashboard route for summary analytics.

1. [ ] Add `/dashboard`.
2. [ ] Add metric cards for crises, people in need, total funding gap, and worst mismatch.
3. [ ] Add charts for funding over time, top underfunded countries, and cluster distribution.
4. [ ] Reuse backend API methods rather than duplicating data logic in the frontend.

MVP exit criteria:

- [ ] Dashboard loads from API data.
- [ ] Charts and cards match globe data.
- [ ] Dashboard can be demoed without voice or AI features.

## Phase 6: Natural-Language Querying

Status: [ ] Not finished

Start with deterministic backend logic, then add LLM support.

1. [ ] Create `POST /api/ask`.
2. [ ] For the first version, parse common questions with rule-based handlers.
3. [ ] Return answer text plus structured sources.
4. [ ] Add a frontend query bar on `/globe`.
5. [ ] Later, replace or augment rules with RAG/vector search.

Example questions:

```text
Which countries have the worst funding gaps?
Show top crises by people in need.
Why is Sudan highlighted?
Compare Sudan and Yemen.
```

MVP exit criteria:

- [ ] Query bar returns useful answers for common questions.
- [ ] Answers cite countries and metrics from the current dataset.
- [ ] Failure states do not break the globe.

## Phase 7: AI and Vector Search

Status: [ ] Not finished

Add AI integrations after the deterministic system works.

1. [ ] Create embeddings for project descriptions and crisis summaries.
2. [ ] Store embeddings in a vector database or Databricks Vector Search.
3. [ ] Add semantic project benchmarking.
4. [ ] Add RAG answers grounded in retrieved project/crisis records.
5. [ ] Add predictive-risk generation from anomaly patterns.

Backend endpoints:

```text
POST /api/benchmark
POST /api/ask
POST /api/predictive/risks
```

MVP exit criteria:

- [ ] Vector search has demo-mode fallback.
- [ ] RAG answers include sources.
- [ ] Predictive risk output is schema-validated before returning to the frontend.

## Phase 8: Voice Agent

Status: [ ] Not finished

Add voice only after the core UI and APIs are stable.

1. [ ] Add an ElevenLabs or Web Speech API voice interface.
2. [ ] Start with push-to-talk.
3. [ ] Map voice commands to safe client tools.
4. [ ] Add visible listening/speaking/error states.
5. [ ] Keep text input as fallback.

Voice commands:

```text
Show Sudan on the globe.
Switch to funding gap mode.
Compare Sudan and Yemen.
Ask which crises are most underfunded.
Generate a report for Somalia.
Reset the view.
```

MVP exit criteria:

- [ ] Voice can control globe navigation and mode changes.
- [ ] Voice failures are visible.
- [ ] User can complete the same tasks with text input.

## Phase 9: Reports

Status: [ ] Not finished

Add downloadable intelligence reports.

1. [ ] Create `GET /api/report?scope=global`.
2. [ ] Create `GET /api/report?scope=country&iso3=SDN`.
3. [ ] Generate a simple HTML/PDF report first.
4. [ ] Later, add LLM-generated executive summaries and recommendations.

MVP exit criteria:

- [ ] Users can download global and country reports.
- [ ] Reports contain real metrics, charts/tables, and timestamped metadata.

## Phase 10: Production Hardening

Status: [ ] Not finished

1. [ ] Add frontend build checks and linting.
2. [ ] Add backend tests for API schemas and edge cases.
3. [ ] Add environment validation on backend startup.
4. [ ] Add request timeouts and retries for external AI/data services.
5. [ ] Add rate limits for AI endpoints and report generation.
6. [ ] Restrict CORS to the deployed frontend domain.
7. [ ] Add structured logs for query failures and slow API calls.

## Suggested Build Order

```text
1. Frontend landing page
2. Static globe with mock data
3. FastAPI mock-data backend
4. Globe fetches real API data
5. Detail overlays and filters
6. Dashboard summaries
7. Text query endpoint
8. Vector/RAG integrations
9. Predictive risk mode
10. Voice agent
11. Reports
12. Deployment and hardening
```

## First Sprint Checklist

- [x] Initialize Next.js app in `frontend/`.
- [x] Initialize FastAPI app in `backend/`.
- [x] Add `.env.example`.
- [x] Add sample crisis data.
- [x] Build `/api/health`.
- [x] Build `/api/globe/crises`.
- [x] Build `/` landing page.
- [x] Build `/globe` with static globe.
- [x] Connect frontend API client to backend.
- [ ] Run frontend and backend locally together.

## Key Engineering Rule

Do not start with voice, LLMs, or Databricks. Build the product with mock data and deterministic APIs first. Once the UI and core data contracts are stable, replace the internals with real data systems and AI integrations.
