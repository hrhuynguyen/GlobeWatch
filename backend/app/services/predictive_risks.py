from app.schemas.ai import PredictiveRiskRequest, PredictiveRiskResponse, RiskSignal
from app.services.data_loader import load_crises, load_projects


def generate_predictive_risks(request: PredictiveRiskRequest) -> PredictiveRiskResponse:
    crises = load_crises(year=request.year, month=request.month)
    projects = load_projects()
    projects_by_iso3 = {}
    for project in projects:
        projects_by_iso3.setdefault(project.iso3, []).append(project)

    signals: list[RiskSignal] = []
    for crisis in crises:
        crisis_projects = projects_by_iso3.get(crisis.iso3, [])
        max_anomaly = max((project.anomaly_score for project in crisis_projects), default=0)
        low_coverage_pressure = max(0.0, 1 - crisis.coverage_ratio)
        people_pressure = min(1.0, crisis.people_in_need / 25_000_000)
        severity_pressure = crisis.severity_score / 100
        risk_score = round(
            (severity_pressure * 42)
            + (low_coverage_pressure * 28)
            + (people_pressure * 18)
            + (min(max_anomaly, 1.5) / 1.5 * 12)
        )

        signals.append(
            RiskSignal(
                iso3=crisis.iso3,
                countryName=crisis.country_name,
                riskScore=min(100, risk_score),
                riskLevel=_risk_level(risk_score),
                drivers=_drivers(crisis.coverage_ratio, crisis.people_in_need, crisis.severity_class, max_anomaly),
                recommendedAction=_recommended_action(crisis.coverage_ratio, max_anomaly),
            )
        )

    signals.sort(key=lambda signal: signal.risk_score, reverse=True)
    return PredictiveRiskResponse(
        year=request.year,
        month=request.month,
        method="weighted-anomaly-demo-model",
        risks=signals[: request.limit],
    )


def _drivers(coverage_ratio: float, people_in_need: int, severity_class: str, max_anomaly: float) -> list[str]:
    drivers = [f"{severity_class.title()} crisis severity"]
    if coverage_ratio < 0.35:
        drivers.append("Low funding coverage")
    if people_in_need >= 10_000_000:
        drivers.append("Large people-in-need caseload")
    if max_anomaly >= 0.75:
        drivers.append("High project anomaly signal")
    return drivers


def _recommended_action(coverage_ratio: float, max_anomaly: float) -> str:
    if coverage_ratio < 0.25:
        return "Prioritize funding-gap escalation and donor briefings."
    if max_anomaly >= 0.85:
        return "Review project cost and beneficiary assumptions before scaling."
    return "Monitor severity and funding movement in the next data refresh."


def _risk_level(score: int) -> str:
    if score >= 80:
        return "critical"
    if score >= 65:
        return "high"
    if score >= 45:
        return "elevated"
    return "watch"
