# GlobeWatch / Crisis Topography Summary

This repo is a 3D geospatial humanitarian intelligence platform called **Crisis Topography: Command Center**. It reframes global aid allocation as a data and capital-allocation problem by showing where crisis severity, funding gaps, and overlooked humanitarian needs are mismatched.

## UI/UX Design

The main experience is a dramatic command-center interface built with **Next.js, React, Tailwind CSS, Three.js/globe.gl, Framer Motion, and Recharts**. The landing page uses scroll-reactive color phases, large editorial typography, animated mock dashboard panels, and a polished "global intelligence" visual language. The globe view uses a dark tactical map aesthetic with glowing atmosphere, extruded country polygons, colored crisis severity gradients, hover/click spotlighting, mode selectors, query panels, activity feeds, and voice-agent overlays.

The UX is designed around exploration rather than static charts: users can rotate and zoom a 3D globe, switch between severity/funding-gap/overlooked/predictive-risk views, click countries for details, compare regions through arcs, and ask questions through text or voice. The repo also includes analytical dashboard and finance-style pages using minimalist black surfaces, compact uppercase labels, metric cards, charts, and dense data tables.

## Functionality

The frontend communicates with a **FastAPI** backend that serves crisis and project data, supports natural-language questions, generates reports, and integrates external AI/data services. Key functionality includes:

- Interactive 3D globe rendering crisis data by country with polygon altitude and color based on severity, funding gap, or oversight score.
- Country and crisis drill-downs, including funding, people-in-need, coverage, beneficiary-to-budget ratios, and project-level outlier data.
- Natural-language data querying through Databricks Genie and RAG endpoints.
- Voice-controlled agent workflow using ElevenLabs WebRTC, with commands for navigation, changing map modes, querying data, comparing countries, changing time periods, generating reports, and running predictive scans.
- Predictive-risk generation that queries anomalous humanitarian projects and asks an LLM to produce future risk assessments.
- Vector benchmarking for similar humanitarian projects using Databricks/Actian-style vector search.
- PDF report generation for global or country-level summaries.

Overall, the repo combines a cinematic 3D crisis map, voice-first AI control, humanitarian funding analytics, vector search, and Databricks-backed data workflows into a hackathon-style global aid command center.
