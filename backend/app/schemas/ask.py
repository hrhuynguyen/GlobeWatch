from pydantic import Field

from app.models.globe import GlobeModel


class AskRequest(GlobeModel):
    question: str = Field(min_length=2, max_length=500)
    year: int | None = Field(default=None, ge=2000, le=2100)
    month: int | None = Field(default=None, ge=1, le=12)
    selected_iso3: str | None = Field(default=None, min_length=3, max_length=3)


class AskSource(GlobeModel):
    iso3: str
    country_name: str
    metric_label: str
    metric_value: str
    description: str


class AskResponse(GlobeModel):
    question: str
    answer: str
    intent: str
    confidence: float
    sources: list[AskSource]
    follow_up_questions: list[str]
    llm_provider: str
    llm_configured: bool
    retrieval_mode: str = "rules"
    embedding_provider: str = "none"
