from fastapi import APIRouter, Query

from app.schemas.dashboard import DashboardSummary
from app.services.dashboard_analytics import get_dashboard_summary


router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/summary", response_model=DashboardSummary)
def dashboard_summary(
    year: int | None = Query(default=None, ge=2000, le=2100),
    month: int | None = Query(default=None, ge=1, le=12),
) -> DashboardSummary:
    return get_dashboard_summary(year=year, month=month)
