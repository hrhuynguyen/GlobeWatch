from pydantic import BaseModel


class CrisisPoint(BaseModel):
    iso3: str
    countryName: str
    crisisName: str
    lat: float
    lng: float
    region: str
    severityScore: int
    severityClass: str
    peopleInNeed: int
    fundingRequestedUsd: int
    fundingReceivedUsd: int
    fundingGapUsd: int
    coverageRatio: float
    lastUpdated: str
    summary: str


class Project(BaseModel):
    projectId: str
    projectCode: str
    iso3: str
    projectName: str
    cluster: str
    requestedFunds: int
    targetBeneficiaries: int
    b2bRatio: float
    costPerBeneficiary: float
    anomalyScore: float

