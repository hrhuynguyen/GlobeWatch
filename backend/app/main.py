import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import globe, health


def parse_cors_origins() -> list[str]:
    origins = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000")
    return [origin.strip() for origin in origins.split(",") if origin.strip()]


app = FastAPI(
    title="GlobeWatch API",
    description="Backend API for crisis globe data, country drilldowns, and project summaries.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=parse_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(globe.router)

