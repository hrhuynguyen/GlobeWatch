from app.models.globe import GlobeModel


class DashboardTotals(GlobeModel):
    crisis_count: int
    people_in_need: int
    funding_requested_usd: int
    funding_received_usd: int
    funding_gap_usd: int
    coverage_ratio: float


class DashboardCountryMetric(GlobeModel):
    iso3: str
    country_name: str
    severity_score: int
    people_in_need: int
    funding_gap_usd: int
    coverage_ratio: float
    oversight_score: int


class FundingTrendPoint(GlobeModel):
    period: str
    year: int
    month: int
    funding_requested_usd: int
    funding_received_usd: int
    funding_gap_usd: int
    coverage_ratio: float


class ClusterDistributionPoint(GlobeModel):
    cluster: str
    project_count: int
    requested_funds: int
    target_beneficiaries: int
    average_anomaly_score: float


class DashboardSummary(GlobeModel):
    year: int | None
    month: int | None
    source: str
    generated_at: str | None
    totals: DashboardTotals
    worst_mismatch: DashboardCountryMetric | None
    top_underfunded: list[DashboardCountryMetric]
    funding_trend: list[FundingTrendPoint]
    cluster_distribution: list[ClusterDistributionPoint]
