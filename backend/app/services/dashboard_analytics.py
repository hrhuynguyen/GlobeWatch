from collections import defaultdict

from app.schemas.dashboard import (
    ClusterDistributionPoint,
    DashboardCountryMetric,
    DashboardSummary,
    DashboardTotals,
    FundingTrendPoint,
)
from app.schemas.globe import CrisisPoint, Project
from app.services.data_loader import load_crises, load_projects, load_snapshot


def get_dashboard_summary(year: int | None = None, month: int | None = None) -> DashboardSummary:
    crises = load_crises(year=year, month=month)
    crisis_iso3 = {crisis.iso3 for crisis in crises}
    projects = [project for project in load_projects() if project.iso3 in crisis_iso3]
    snapshot = load_snapshot()
    response_year = year if year is not None else snapshot.year if snapshot else None
    response_month = month if month is not None else snapshot.month if snapshot else None

    return DashboardSummary(
        year=response_year,
        month=response_month,
        source=snapshot.source if snapshot else "Sample crisis data",
        generated_at=snapshot.generated_at if snapshot else None,
        totals=_build_totals(crises),
        worst_mismatch=_find_worst_mismatch(crises),
        top_underfunded=_top_underfunded(crises),
        funding_trend=_funding_trend(load_crises(year=year)),
        cluster_distribution=_cluster_distribution(projects),
    )


def _build_totals(crises: list[CrisisPoint]) -> DashboardTotals:
    funding_requested_usd = sum(crisis.funding_requested_usd for crisis in crises)
    funding_received_usd = sum(crisis.funding_received_usd for crisis in crises)

    return DashboardTotals(
        crisis_count=len(crises),
        people_in_need=sum(crisis.people_in_need for crisis in crises),
        funding_requested_usd=funding_requested_usd,
        funding_received_usd=funding_received_usd,
        funding_gap_usd=sum(crisis.funding_gap_usd for crisis in crises),
        coverage_ratio=_safe_ratio(funding_received_usd, funding_requested_usd),
    )


def _country_metric(crisis: CrisisPoint) -> DashboardCountryMetric:
    return DashboardCountryMetric(
        iso3=crisis.iso3,
        country_name=crisis.country_name,
        severity_score=crisis.severity_score,
        people_in_need=crisis.people_in_need,
        funding_gap_usd=crisis.funding_gap_usd,
        coverage_ratio=crisis.coverage_ratio,
        oversight_score=crisis.oversight_score,
    )


def _find_worst_mismatch(crises: list[CrisisPoint]) -> DashboardCountryMetric | None:
    if not crises:
        return None

    crisis = max(
        crises,
        key=lambda item: (item.funding_gap_usd * (1 - item.coverage_ratio), item.oversight_score),
    )
    return _country_metric(crisis)


def _top_underfunded(crises: list[CrisisPoint], limit: int = 8) -> list[DashboardCountryMetric]:
    return [
        _country_metric(crisis)
        for crisis in sorted(crises, key=lambda item: item.funding_gap_usd, reverse=True)[:limit]
    ]


def _funding_trend(crises: list[CrisisPoint]) -> list[FundingTrendPoint]:
    grouped: dict[tuple[int, int], dict[str, int]] = defaultdict(
        lambda: {"requested": 0, "received": 0, "gap": 0}
    )

    for crisis in crises:
        bucket = grouped[(crisis.year, crisis.month)]
        bucket["requested"] += crisis.funding_requested_usd
        bucket["received"] += crisis.funding_received_usd
        bucket["gap"] += crisis.funding_gap_usd

    return [
        FundingTrendPoint(
            period=f"{year}-{month:02d}",
            year=year,
            month=month,
            funding_requested_usd=values["requested"],
            funding_received_usd=values["received"],
            funding_gap_usd=values["gap"],
            coverage_ratio=_safe_ratio(values["received"], values["requested"]),
        )
        for (year, month), values in sorted(grouped.items())
    ]


def _cluster_distribution(projects: list[Project]) -> list[ClusterDistributionPoint]:
    grouped: dict[str, dict[str, float]] = defaultdict(
        lambda: {"project_count": 0, "requested_funds": 0, "target_beneficiaries": 0, "anomaly_total": 0.0}
    )

    for project in projects:
        bucket = grouped[project.cluster]
        bucket["project_count"] += 1
        bucket["requested_funds"] += project.requested_funds
        bucket["target_beneficiaries"] += project.target_beneficiaries
        bucket["anomaly_total"] += project.anomaly_score

    distribution = [
        ClusterDistributionPoint(
            cluster=cluster,
            project_count=int(values["project_count"]),
            requested_funds=int(values["requested_funds"]),
            target_beneficiaries=int(values["target_beneficiaries"]),
            average_anomaly_score=round(values["anomaly_total"] / values["project_count"], 2),
        )
        for cluster, values in grouped.items()
        if values["project_count"] > 0
    ]

    return sorted(distribution, key=lambda item: item.requested_funds, reverse=True)[:10]


def _safe_ratio(numerator: int | float, denominator: int | float) -> float:
    if denominator <= 0:
        return 0.0

    return round(numerator / denominator, 4)
