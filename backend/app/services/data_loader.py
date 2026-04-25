import json
from functools import lru_cache
from pathlib import Path

from app.schemas.globe import CrisisPoint, GlobeSnapshot, Project


ROOT = Path(__file__).resolve().parents[3]
SAMPLE_DATA_PATH = ROOT / "data" / "sample" / "crises.json"
PROCESSED_DATA_PATH = ROOT / "data" / "processed" / "globe_snapshot_2026.json"


@lru_cache
def load_snapshot() -> GlobeSnapshot | None:
    if not PROCESSED_DATA_PATH.exists():
        return None

    with PROCESSED_DATA_PATH.open("r", encoding="utf-8") as file:
        return GlobeSnapshot(**json.load(file))


@lru_cache
def load_sample_crises() -> list[CrisisPoint]:
    with SAMPLE_DATA_PATH.open("r", encoding="utf-8") as file:
        records = json.load(file)

    return [
        CrisisPoint(
            crisisId=f"{record['iso3']}-sample-2026",
            year=2026,
            month=4,
            oversightScore=round(record["severityScore"] * (1 - record["coverageRatio"])),
            fundingPerCapita=round(record["fundingReceivedUsd"] / record["peopleInNeed"], 2),
            **record,
        )
        for record in records
    ]


def load_crises(year: int | None = None, month: int | None = None) -> list[CrisisPoint]:
    snapshot = load_snapshot()
    crises = snapshot.crises if snapshot is not None else load_sample_crises()

    if year is not None:
        crises = [crisis for crisis in crises if crisis.year == year]
    if month is not None:
        crises = [crisis for crisis in crises if crisis.month == month]

    return crises


def get_crisis_by_iso3(iso3: str) -> CrisisPoint | None:
    normalized_iso3 = iso3.upper()
    return next((crisis for crisis in load_crises() if crisis.iso3 == normalized_iso3), None)


def load_projects(iso3: str | None = None) -> list[Project]:
    snapshot = load_snapshot()
    if snapshot is not None:
        projects = snapshot.projects
        if iso3:
            normalized_iso3 = iso3.upper()
            return [project for project in projects if project.iso3 == normalized_iso3]
        return projects

    crises = load_sample_crises()
    if iso3:
        normalized_iso3 = iso3.upper()
        crises = [crisis for crisis in crises if crisis.iso3 == normalized_iso3]

    projects: list[Project] = []
    for crisis in crises:
        protection_funds = int(crisis.funding_requested_usd * 0.18)
        food_funds = int(crisis.funding_requested_usd * 0.26)
        health_funds = int(crisis.funding_requested_usd * 0.14)

        project_specs = [
            ("PRO", "Protection", "Protection access expansion", protection_funds, 0.16, 0.72),
            ("FSL", "Food Security", "Emergency food and livelihoods support", food_funds, 0.24, 0.81),
            ("HLT", "Health", "Mobile health and disease surveillance", health_funds, 0.11, 0.64),
        ]

        for suffix, cluster, name, requested_funds, beneficiary_ratio, anomaly_score in project_specs:
            target_beneficiaries = max(1, int(crisis.people_in_need * beneficiary_ratio))
            projects.append(
                Project(
                    projectId=f"{crisis.iso3}-{suffix}-2026",
                    projectCode=f"{crisis.iso3}-{suffix}",
                    iso3=crisis.iso3,
                    projectName=f"{crisis.country_name}: {name}",
                    cluster=cluster,
                    requestedFunds=requested_funds,
                    targetBeneficiaries=target_beneficiaries,
                    b2bRatio=target_beneficiaries / requested_funds,
                    costPerBeneficiary=requested_funds / target_beneficiaries,
                    anomalyScore=round(anomaly_score + (crisis.severity_score / 1000), 2),
                )
            )

    return projects
