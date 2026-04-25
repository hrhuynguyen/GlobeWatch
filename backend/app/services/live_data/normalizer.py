from datetime import UTC, datetime
from typing import Any

from app.models.globe import Country, Crisis, GlobeSnapshot, Project
from app.services.metrics import (
    coverage_ratio,
    funding_gap,
    funding_per_capita,
    oversight_score,
    severity_class,
    severity_score,
)


SOURCE = "OCHA HPC/FTS + World Bank population"
SOURCE_URL = "https://api.hpc.tools/docs/v1/"


def normalize_snapshot(
    *,
    year: int,
    month: int,
    plans_payload: dict[str, Any],
    flows_payload: dict[str, Any],
    governing_entities_by_plan_id: dict[int, dict[str, Any]],
    populations_by_iso3: dict[str, int],
    limit: int = 12,
) -> GlobeSnapshot:
    funding_by_location_id = _funding_by_destination_location_id(flows_payload)
    countries_by_iso3: dict[str, Country] = {}
    crises_by_iso3: dict[str, Crisis] = {}
    projects: list[Project] = []

    for plan in plans_payload.get("data", []):
        if not plan.get("isReleased"):
            continue

        if _is_regional_plan(plan):
            continue

        location = _primary_country_location(plan)
        if location is None:
            continue

        iso3 = str(location.get("iso3", "")).upper()
        requested = int(plan.get("revisedRequirements") or plan.get("origRequirements") or 0)
        if not iso3 or requested <= 0:
            continue

        received = int(funding_by_location_id.get(str(location.get("id")), 0))
        gap = funding_gap(requested, received)
        coverage = coverage_ratio(requested, received)
        people_in_need = _max_metric_value(governing_entities_by_plan_id.get(int(plan["id"]), {}), "inNeed")
        score = severity_score(requested, gap, people_in_need)
        plan_version = plan.get("planVersion") or {}
        country_name = plan_version.get("shortName") or location.get("name") or iso3
        crisis_name = plan_version.get("name") or f"{country_name} humanitarian response"
        last_updated = _date_only(plan.get("updatedAt") or plan_version.get("updatedAt") or plan.get("releasedDate"))

        country = Country(
            iso3=iso3,
            country_name=country_name,
            lat=float(location.get("latitude") or 0),
            lng=float(location.get("longitude") or 0),
            population=populations_by_iso3.get(iso3, 0),
            region=_plan_type(plan),
        )
        countries_by_iso3[iso3] = country

        existing = crises_by_iso3.get(iso3)
        if existing is not None and existing.funding_requested_usd >= requested:
            continue

        crises_by_iso3[iso3] = Crisis(
            crisis_id=f"{iso3}-{year}-{plan['id']}",
            iso3=iso3,
            country_name=country_name,
            crisis_name=crisis_name,
            year=year,
            month=month,
            lat=country.lat,
            lng=country.lng,
            region=country.region,
            severity_score=score,
            severity_class=severity_class(score),
            people_in_need=people_in_need,
            funding_requested_usd=requested,
            funding_received_usd=received,
            funding_gap_usd=gap,
            coverage_ratio=coverage,
            oversight_score=oversight_score(score, coverage),
            funding_per_capita=funding_per_capita(received, people_in_need),
            last_updated=last_updated,
            summary=_summary(country_name, requested, received, gap, people_in_need, last_updated),
        )
        projects.extend(_projects_for_plan(plan, iso3, governing_entities_by_plan_id.get(int(plan["id"]), {})))

    crises = sorted(crises_by_iso3.values(), key=lambda item: item.funding_gap_usd, reverse=True)[:limit]
    selected_iso3 = {crisis.iso3 for crisis in crises}
    countries = [countries_by_iso3[iso3] for iso3 in selected_iso3 if iso3 in countries_by_iso3]
    selected_projects = [project for project in projects if project.iso3 in selected_iso3]

    return GlobeSnapshot(
        source=SOURCE,
        source_url=SOURCE_URL,
        generated_at=datetime.now(UTC).isoformat(),
        year=year,
        month=month,
        countries=sorted(countries, key=lambda item: item.country_name),
        crises=crises,
        projects=selected_projects,
    )


def _primary_country_location(plan: dict[str, Any]) -> dict[str, Any] | None:
    locations = [item for item in plan.get("locations", []) if item.get("adminLevel") == 0 and item.get("iso3")]
    if not locations:
        return None
    return locations[0]


def _funding_by_destination_location_id(flows_payload: dict[str, Any]) -> dict[str, int]:
    reports = flows_payload.get("data", {})
    report = reports.get("report3") or reports.get("report2") or {}
    objects = report.get("fundingTotals", {}).get("objects", [])

    for item in objects:
        if item.get("direction") != "destination":
            continue

        return {
            str(row["id"]): int(row.get("totalFunding") or 0)
            for row in item.get("objectsBreakdown", [])
            if row.get("id") is not None
        }

    return {}


def _max_metric_value(payload: dict[str, Any], metric_type: str) -> int:
    values: list[int] = []

    def visit(value: Any) -> None:
        if isinstance(value, dict):
            if value.get("type") == metric_type and isinstance(value.get("value"), (int, float)):
                values.append(int(value["value"]))
            for child in value.values():
                visit(child)
        elif isinstance(value, list):
            for child in value:
                visit(child)

    visit(payload)
    return max(values, default=0)


def _projects_for_plan(plan: dict[str, Any], iso3: str, governing_payload: dict[str, Any]) -> list[Project]:
    projects: list[Project] = []
    for entity in governing_payload.get("data", []):
        name = ((entity.get("governingEntityVersion") or {}).get("name") or "").strip()
        if not name:
            continue

        requested = _attachment_cost(entity)
        target = _attachment_metric(entity, "target")
        if requested <= 0:
            continue

        projects.append(
            Project(
                project_id=f"{iso3}-{plan['id']}-{entity['id']}",
                project_code=str((entity.get("governingEntityVersion") or {}).get("customReference") or entity["id"]),
                iso3=iso3,
                project_name=f"{name} response envelope",
                cluster=name,
                requested_funds=requested,
                target_beneficiaries=target,
                b2b_ratio=round(target / requested, 8) if requested > 0 else 0,
                cost_per_beneficiary=round(requested / target, 2) if target > 0 else 0,
                anomaly_score=round(min(1.0, requested / max(1, int(plan.get("revisedRequirements") or requested))), 3),
            )
        )

    return projects


def _attachment_cost(entity: dict[str, Any]) -> int:
    for attachment in entity.get("attachments", []):
        value = ((attachment.get("attachmentVersion") or {}).get("value") or {})
        cost = value.get("cost")
        if isinstance(cost, (int, float)):
            return int(cost)
    return 0


def _attachment_metric(entity: dict[str, Any], metric_type: str) -> int:
    for attachment in entity.get("attachments", []):
        value = ((attachment.get("attachmentVersion") or {}).get("value") or {})
        totals = (((value.get("metrics") or {}).get("values") or {}).get("totals") or [])
        for item in totals:
            if item.get("type") == metric_type and isinstance(item.get("value"), (int, float)):
                return int(item["value"])
    return 0


def _plan_type(plan: dict[str, Any]) -> str:
    for category in plan.get("categories", []):
        if category.get("group") == "planType" and category.get("name"):
            return str(category["name"])
    return "Humanitarian response plan"


def _is_regional_plan(plan: dict[str, Any]) -> bool:
    plan_type = _plan_type(plan).lower()
    short_name = str((plan.get("planVersion") or {}).get("shortName") or "").lower()
    return "regional" in plan_type or "(rmrp)" in short_name or "(3rp)" in short_name


def _date_only(value: str | None) -> str:
    if not value:
        return datetime.now(UTC).date().isoformat()
    return value.split("T", maxsplit=1)[0]


def _summary(country_name: str, requested: int, received: int, gap: int, people_in_need: int, last_updated: str) -> str:
    need_text = f"{people_in_need:,} people in need" if people_in_need else "needs data pending"
    return (
        f"{country_name}'s latest OCHA 2026 plan reports {need_text}, "
        f"${requested:,.0f} requested, ${received:,.0f} received, and a ${gap:,.0f} funding gap "
        f"as of {last_updated}."
    )
