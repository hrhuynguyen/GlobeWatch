from fastapi import APIRouter, HTTPException, Query

from app.schemas.globe import CrisisPoint, Project
from app.services.data_loader import get_crisis_by_iso3, load_crises, load_projects


router = APIRouter(prefix="/api/globe", tags=["globe"])


@router.get("/crises", response_model=list[CrisisPoint])
def list_crises(
    year: int | None = Query(default=None, ge=2000, le=2100),
    month: int | None = Query(default=None, ge=1, le=12),
) -> list[CrisisPoint]:
    # The Phase 2 dataset is static; filters are accepted now so the frontend
    # contract will not change when time-series data is added later.
    _ = (year, month)
    return load_crises()


@router.get("/countries/{iso3}", response_model=CrisisPoint)
def get_country(iso3: str) -> CrisisPoint:
    crisis = get_crisis_by_iso3(iso3)
    if crisis is None:
        raise HTTPException(status_code=404, detail=f"Country {iso3.upper()} was not found")

    return crisis


@router.get("/projects", response_model=list[Project])
def list_projects(iso3: str | None = Query(default=None, min_length=3, max_length=3)) -> list[Project]:
    projects = load_projects(iso3)
    if iso3 and not projects:
        raise HTTPException(status_code=404, detail=f"No projects found for {iso3.upper()}")

    return projects

