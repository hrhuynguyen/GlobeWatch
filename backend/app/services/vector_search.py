import math
import os
import re
from collections import Counter
from dataclasses import dataclass
from functools import lru_cache

from app.schemas.ai import VectorMatch
from app.schemas.ask import AskSource
from app.schemas.globe import CrisisPoint, Project
from app.services.data_loader import load_crises, load_projects


STOP_WORDS = {
    "a",
    "an",
    "and",
    "are",
    "as",
    "at",
    "by",
    "for",
    "from",
    "has",
    "have",
    "in",
    "into",
    "is",
    "it",
    "of",
    "on",
    "or",
    "that",
    "the",
    "to",
    "with",
}


@dataclass(frozen=True)
class VectorDocument:
    record_id: str
    record_type: str
    iso3: str
    country_name: str
    title: str
    text: str
    metric_label: str
    metric_value: str
    description: str


@dataclass(frozen=True)
class RankedDocument:
    document: VectorDocument
    score: float


@dataclass(frozen=True)
class VectorIndex:
    documents: tuple[VectorDocument, ...]
    idf: dict[str, float]
    vectors: tuple[dict[str, float], ...]


def embedding_provider() -> str:
    return os.getenv("EMBEDDING_PROVIDER", "local-sparse")


def retrieval_mode() -> str:
    configured_mode = os.getenv("VECTOR_STORE", "local-memory")
    if configured_mode == "local-memory":
        return "local-memory"
    return f"{configured_mode}-configured-local-fallback"


def semantic_search(
    query: str,
    *,
    year: int | None = None,
    month: int | None = None,
    iso3: str | None = None,
    limit: int = 5,
) -> list[RankedDocument]:
    index = _build_index(year, month)
    if not index.documents:
        return []

    query_vector = _embed(query, index.idf)
    normalized_iso3 = iso3.upper() if iso3 else None
    query_tokens = set(_tokenize(query))
    ranked: list[RankedDocument] = []

    for document, vector in zip(index.documents, index.vectors):
        if normalized_iso3 and document.iso3 != normalized_iso3:
            continue

        score = _cosine(query_vector, vector)
        if document.iso3.lower() in query_tokens or _normalize(document.country_name) in _normalize(query):
            score += 0.18
        if document.record_type == "crisis":
            score += 0.03
        ranked.append(RankedDocument(document=document, score=round(score, 4)))

    ranked.sort(key=lambda item: item.score, reverse=True)
    return [item for item in ranked[:limit] if item.score > 0] or ranked[:limit]


def vector_matches(
    query: str,
    *,
    year: int | None = None,
    month: int | None = None,
    iso3: str | None = None,
    limit: int = 5,
) -> list[VectorMatch]:
    return [
        VectorMatch(
            recordId=item.document.record_id,
            recordType=item.document.record_type,
            iso3=item.document.iso3,
            countryName=item.document.country_name,
            title=item.document.title,
            score=item.score,
            metricLabel=item.document.metric_label,
            metricValue=item.document.metric_value,
            description=item.document.description,
        )
        for item in semantic_search(query, year=year, month=month, iso3=iso3, limit=limit)
    ]


def matches_to_ask_sources(matches: list[RankedDocument]) -> list[AskSource]:
    return [
        AskSource(
            iso3=match.document.iso3,
            countryName=match.document.country_name,
            metricLabel=f"{match.document.metric_label} · match {match.score:.0%}",
            metricValue=match.document.metric_value,
            description=match.document.description,
        )
        for match in matches
    ]


def context_from_matches(matches: list[RankedDocument]) -> str:
    lines = []
    for index, match in enumerate(matches, start=1):
        document = match.document
        lines.append(
            f"[{index}] {document.record_type.upper()} | {document.country_name} ({document.iso3}) | "
            f"{document.title} | {document.metric_label}: {document.metric_value} | {document.description}"
        )
    return "\n".join(lines)


@lru_cache
def _build_index(year: int | None, month: int | None) -> VectorIndex:
    documents = tuple(_load_documents(year, month))
    doc_tokens = [_tokenize(document.text) for document in documents]
    document_frequency = Counter(token for tokens in doc_tokens for token in set(tokens))
    doc_count = max(len(documents), 1)
    idf = {
        token: math.log((doc_count + 1) / (frequency + 1)) + 1
        for token, frequency in document_frequency.items()
    }
    vectors = tuple(_embed_tokens(tokens, idf) for tokens in doc_tokens)
    return VectorIndex(documents=documents, idf=idf, vectors=vectors)


def _load_documents(year: int | None, month: int | None) -> list[VectorDocument]:
    crises = load_crises(year=year, month=month)
    projects = load_projects()
    crisis_by_iso3 = {crisis.iso3: crisis for crisis in crises}
    documents: list[VectorDocument] = [_crisis_document(crisis) for crisis in crises]

    for project in projects:
        crisis = crisis_by_iso3.get(project.iso3)
        if year is not None or month is not None:
            if crisis is None:
                continue
        documents.append(_project_document(project, crisis))

    return documents


def _crisis_document(crisis: CrisisPoint) -> VectorDocument:
    metric_value = f"{_whole(crisis.people_in_need)} people in need, {_usd(crisis.funding_gap_usd)} gap"
    text = (
        f"{crisis.country_name} {crisis.iso3} {crisis.crisis_name} {crisis.region} "
        f"{crisis.severity_class} severity score {crisis.severity_score} "
        f"people in need {crisis.people_in_need} funding gap {crisis.funding_gap_usd} "
        f"coverage {crisis.coverage_ratio:.2f} {crisis.summary}"
    )
    return VectorDocument(
        record_id=crisis.crisis_id,
        record_type="crisis",
        iso3=crisis.iso3,
        country_name=crisis.country_name,
        title=crisis.crisis_name,
        text=text,
        metric_label="Crisis summary",
        metric_value=metric_value,
        description=crisis.summary,
    )


def _project_document(project: Project, crisis: CrisisPoint | None) -> VectorDocument:
    country_name = crisis.country_name if crisis else project.iso3
    text = (
        f"{country_name} {project.iso3} {project.project_name} {project.cluster} "
        f"requested funds {project.requested_funds} target beneficiaries {project.target_beneficiaries} "
        f"cost per beneficiary {project.cost_per_beneficiary:.2f} anomaly score {project.anomaly_score:.2f}"
    )
    description = (
        f"{project.cluster} project targeting {_whole(project.target_beneficiaries)} beneficiaries "
        f"at {_usd(project.requested_funds)} requested funds."
    )
    return VectorDocument(
        record_id=project.project_id,
        record_type="project",
        iso3=project.iso3,
        country_name=country_name,
        title=project.project_name,
        text=text,
        metric_label=project.cluster,
        metric_value=_usd(project.requested_funds),
        description=description,
    )


def _embed(text: str, idf: dict[str, float]) -> dict[str, float]:
    return _embed_tokens(_tokenize(text), idf)


def _embed_tokens(tokens: list[str], idf: dict[str, float]) -> dict[str, float]:
    if not tokens:
        return {}
    counts = Counter(tokens)
    total = sum(counts.values())
    return {token: (count / total) * idf.get(token, 1.0) for token, count in counts.items()}


def _cosine(first: dict[str, float], second: dict[str, float]) -> float:
    if not first or not second:
        return 0.0
    shared = set(first).intersection(second)
    numerator = sum(first[token] * second[token] for token in shared)
    first_norm = math.sqrt(sum(value * value for value in first.values()))
    second_norm = math.sqrt(sum(value * value for value in second.values()))
    if first_norm == 0 or second_norm == 0:
        return 0.0
    return numerator / (first_norm * second_norm)


def _tokenize(value: str) -> list[str]:
    return [token for token in re.findall(r"[a-z0-9]+", value.lower()) if token not in STOP_WORDS]


def _normalize(value: str) -> str:
    return re.sub(r"\s+", " ", re.sub(r"[^a-z0-9\s]", " ", value.lower())).strip()


def _usd(value: int) -> str:
    abs_value = abs(value)
    if abs_value >= 1_000_000_000:
        return f"${value / 1_000_000_000:.1f}B"
    if abs_value >= 1_000_000:
        return f"${value / 1_000_000:.1f}M"
    return f"${value:,}"


def _whole(value: int) -> str:
    return f"{value:,}"
