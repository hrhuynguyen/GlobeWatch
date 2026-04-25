from pydantic import Field

from app.models.globe import GlobeModel


class VectorMatch(GlobeModel):
    record_id: str
    record_type: str
    iso3: str
    country_name: str
    title: str
    score: float
    metric_label: str
    metric_value: str
    description: str


class BenchmarkRequest(GlobeModel):
    query: str = Field(min_length=2, max_length=500)
    iso3: str | None = Field(default=None, min_length=3, max_length=3)
    year: int | None = Field(default=None, ge=2000, le=2100)
    month: int | None = Field(default=None, ge=1, le=12)
    limit: int = Field(default=5, ge=1, le=10)


class BenchmarkResponse(GlobeModel):
    query: str
    retrieval_mode: str
    embedding_provider: str
    matches: list[VectorMatch]
    insight: str


class PredictiveRiskRequest(GlobeModel):
    year: int | None = Field(default=None, ge=2000, le=2100)
    month: int | None = Field(default=None, ge=1, le=12)
    limit: int = Field(default=5, ge=1, le=12)


class RiskSignal(GlobeModel):
    iso3: str
    country_name: str
    risk_score: int
    risk_level: str
    drivers: list[str]
    recommended_action: str


class PredictiveRiskResponse(GlobeModel):
    year: int | None
    month: int | None
    method: str
    risks: list[RiskSignal]
