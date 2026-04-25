from pydantic import BaseModel, ConfigDict, Field


def to_camel(value: str) -> str:
    parts = value.split("_")
    return parts[0] + "".join(part.capitalize() for part in parts[1:])


class GlobeModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class Country(GlobeModel):
    iso3: str
    country_name: str
    lat: float
    lng: float
    population: int = 0
    region: str = "Humanitarian response plan"


class Crisis(GlobeModel):
    crisis_id: str
    iso3: str
    country_name: str
    crisis_name: str
    year: int
    month: int
    lat: float
    lng: float
    region: str
    severity_score: int
    severity_class: str
    people_in_need: int
    funding_requested_usd: int
    funding_received_usd: int
    funding_gap_usd: int
    coverage_ratio: float
    oversight_score: int
    funding_per_capita: float
    last_updated: str
    summary: str
    source: str = "OCHA HPC / FTS"
    source_url: str = "https://api.hpc.tools/docs/v1/"


class Project(GlobeModel):
    project_id: str
    project_code: str
    iso3: str
    project_name: str
    cluster: str
    requested_funds: int
    target_beneficiaries: int
    b2b_ratio: float
    cost_per_beneficiary: float
    anomaly_score: float


class GlobeSnapshot(GlobeModel):
    source: str
    source_url: str
    generated_at: str
    year: int
    month: int
    countries: list[Country] = Field(default_factory=list)
    crises: list[Crisis] = Field(default_factory=list)
    projects: list[Project] = Field(default_factory=list)

