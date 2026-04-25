from fastapi import APIRouter

from app.schemas.ai import BenchmarkRequest, BenchmarkResponse, PredictiveRiskRequest, PredictiveRiskResponse
from app.services.benchmarking import benchmark_projects
from app.services.predictive_risks import generate_predictive_risks


router = APIRouter(prefix="/api", tags=["ai"])


@router.post("/benchmark", response_model=BenchmarkResponse)
def benchmark(request: BenchmarkRequest) -> BenchmarkResponse:
    return benchmark_projects(request)


@router.post("/predictive/risks", response_model=PredictiveRiskResponse)
def predictive_risks(request: PredictiveRiskRequest) -> PredictiveRiskResponse:
    return generate_predictive_risks(request)
