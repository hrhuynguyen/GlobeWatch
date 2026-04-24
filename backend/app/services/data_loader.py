import json
from functools import lru_cache
from pathlib import Path

from app.schemas.globe import CrisisPoint, Project


DATA_PATH = Path(__file__).resolve().parents[3] / "data" / "sample" / "crises.json"


@lru_cache
def load_crises() -> list[CrisisPoint]:
    with DATA_PATH.open("r", encoding="utf-8") as file:
        records = json.load(file)

    return [CrisisPoint(**record) for record in records]


def get_crisis_by_iso3(iso3: str) -> CrisisPoint | None:
    normalized_iso3 = iso3.upper()
    return next((crisis for crisis in load_crises() if crisis.iso3 == normalized_iso3), None)


def load_projects(iso3: str | None = None) -> list[Project]:
    crises = load_crises()
    if iso3:
        normalized_iso3 = iso3.upper()
        crises = [crisis for crisis in crises if crisis.iso3 == normalized_iso3]

    projects: list[Project] = []
    for crisis in crises:
        protection_funds = int(crisis.fundingRequestedUsd * 0.18)
        food_funds = int(crisis.fundingRequestedUsd * 0.26)
        health_funds = int(crisis.fundingRequestedUsd * 0.14)

        project_specs = [
            ("PRO", "Protection", "Protection access expansion", protection_funds, 0.16, 0.72),
            ("FSL", "Food Security", "Emergency food and livelihoods support", food_funds, 0.24, 0.81),
            ("HLT", "Health", "Mobile health and disease surveillance", health_funds, 0.11, 0.64),
        ]

        for suffix, cluster, name, requested_funds, beneficiary_ratio, anomaly_score in project_specs:
            target_beneficiaries = max(1, int(crisis.peopleInNeed * beneficiary_ratio))
            projects.append(
                Project(
                    projectId=f"{crisis.iso3}-{suffix}-2026",
                    projectCode=f"{crisis.iso3}-{suffix}",
                    iso3=crisis.iso3,
                    projectName=f"{crisis.countryName}: {name}",
                    cluster=cluster,
                    requestedFunds=requested_funds,
                    targetBeneficiaries=target_beneficiaries,
                    b2bRatio=target_beneficiaries / requested_funds,
                    costPerBeneficiary=requested_funds / target_beneficiaries,
                    anomalyScore=round(anomaly_score + (crisis.severityScore / 1000), 2),
                )
            )

    return projects

