import os
import re
from collections import defaultdict

from app.schemas.ask import AskRequest, AskResponse, AskSource
from app.schemas.globe import CrisisPoint, Project
from app.services.gemini_client import gemini_configured
from app.services.data_loader import load_crises, load_projects
from app.services.rag_answers import answer_with_rag, should_use_rag


def answer_question(request: AskRequest) -> AskResponse:
    crises = load_crises(year=request.year, month=request.month)
    projects = load_projects()
    question = request.question.strip()
    normalized_question = _normalize(question)
    llm_provider = os.getenv("LLM_PROVIDER", "rule-based").lower()
    llm_configured = gemini_configured() if llm_provider == "gemini" else False

    if not crises:
        return _response(
            request=question,
            answer="No crisis records are available for the selected period.",
            intent="no_data",
            confidence=1.0,
            sources=[],
            llm_provider=llm_provider,
            llm_configured=llm_configured,
        )

    mentioned = _find_mentioned_crises(normalized_question, crises)
    if request.selected_iso3 and len(mentioned) < 2:
        selected = _find_by_iso3(crises, request.selected_iso3)
        if selected and selected not in mentioned:
            mentioned.append(selected)

    if should_use_rag(normalized_question):
        return answer_with_rag(request, llm_provider=llm_provider, llm_configured=llm_configured)

    if _is_compare_question(normalized_question) and len(mentioned) >= 2:
        return _compare_countries(question, mentioned[:2], llm_provider, llm_configured)

    if _has_any(normalized_question, ["why", "highlight", "selected", "flagged"]) and mentioned:
        return _explain_country(question, mentioned[0], llm_provider, llm_configured)

    if _has_any(normalized_question, ["people", "need", "population", "affected"]):
        ranked = sorted(crises, key=lambda item: item.people_in_need, reverse=True)[:5]
        return _ranked_answer(
            request=question,
            intent="top_people_in_need",
            intro="The largest people-in-need caseloads are",
            crises=ranked,
            metric_label="People in need",
            metric_getter=lambda crisis: _whole(crisis.people_in_need),
            source_description=lambda crisis: crisis.summary,
            llm_provider=llm_provider,
            llm_configured=llm_configured,
        )

    if _has_any(normalized_question, ["severity", "severe", "critical", "risk"]):
        ranked = sorted(crises, key=lambda item: item.severity_score, reverse=True)[:5]
        return _ranked_answer(
            request=question,
            intent="top_severity",
            intro="The highest severity scores are",
            crises=ranked,
            metric_label="Severity score",
            metric_getter=lambda crisis: str(crisis.severity_score),
            source_description=lambda crisis: f"{crisis.severity_class.title()} severity: {crisis.summary}",
            llm_provider=llm_provider,
            llm_configured=llm_configured,
        )

    if _has_any(normalized_question, ["coverage", "covered", "funded"]) and _has_any(
        normalized_question, ["lowest", "least", "under", "worst"]
    ):
        ranked = sorted(crises, key=lambda item: item.coverage_ratio)[:5]
        return _ranked_answer(
            request=question,
            intent="lowest_coverage",
            intro="The lowest funding coverage ratios are",
            crises=ranked,
            metric_label="Coverage",
            metric_getter=lambda crisis: _percent(crisis.coverage_ratio),
            source_description=lambda crisis: f"{_usd(crisis.funding_gap_usd)} funding gap.",
            llm_provider=llm_provider,
            llm_configured=llm_configured,
        )

    if _has_any(normalized_question, ["project", "cluster", "program", "sector"]):
        return _project_answer(question, mentioned, projects, llm_provider, llm_configured)

    if _has_any(normalized_question, ["gap", "underfunded", "funding", "money", "budget", "worst"]):
        ranked = sorted(crises, key=lambda item: item.funding_gap_usd, reverse=True)[:5]
        return _ranked_answer(
            request=question,
            intent="top_funding_gaps",
            intro="The largest funding gaps are",
            crises=ranked,
            metric_label="Funding gap",
            metric_getter=lambda crisis: _usd(crisis.funding_gap_usd),
            source_description=lambda crisis: f"{_percent(crisis.coverage_ratio)} covered.",
            llm_provider=llm_provider,
            llm_configured=llm_configured,
        )

    if llm_provider == "gemini" and llm_configured:
        return answer_with_rag(request, llm_provider=llm_provider, llm_configured=llm_configured)

    return _overview_answer(question, crises, llm_provider, llm_configured)


def _compare_countries(
    question: str, crises: list[CrisisPoint], llm_provider: str, llm_configured: bool
) -> AskResponse:
    first, second = crises
    answer = (
        f"{first.country_name} has {_whole(first.people_in_need)} people in need and "
        f"a {_usd(first.funding_gap_usd)} funding gap with {_percent(first.coverage_ratio)} coverage. "
        f"{second.country_name} has {_whole(second.people_in_need)} people in need and "
        f"a {_usd(second.funding_gap_usd)} funding gap with {_percent(second.coverage_ratio)} coverage. "
        f"By severity score, {first.country_name} is {first.severity_score} and "
        f"{second.country_name} is {second.severity_score}."
    )
    return _response(
        request=question,
        answer=answer,
        intent="compare_countries",
        confidence=0.9,
        sources=[
            _source(first, "Funding gap", _usd(first.funding_gap_usd), first.summary),
            _source(second, "Funding gap", _usd(second.funding_gap_usd), second.summary),
        ],
        llm_provider=llm_provider,
        llm_configured=llm_configured,
    )


def _explain_country(question: str, crisis: CrisisPoint, llm_provider: str, llm_configured: bool) -> AskResponse:
    answer = (
        f"{crisis.country_name} is highlighted because it has a {crisis.severity_class} crisis profile, "
        f"{_whole(crisis.people_in_need)} people in need, a {_usd(crisis.funding_gap_usd)} funding gap, "
        f"and only {_percent(crisis.coverage_ratio)} funding coverage. {crisis.summary}"
    )
    return _response(
        request=question,
        answer=answer,
        intent="explain_country",
        confidence=0.9,
        sources=[
            _source(crisis, "Severity score", str(crisis.severity_score), crisis.summary),
            _source(crisis, "Funding coverage", _percent(crisis.coverage_ratio), "Current funding coverage ratio."),
        ],
        llm_provider=llm_provider,
        llm_configured=llm_configured,
    )


def _project_answer(
    question: str,
    mentioned: list[CrisisPoint],
    projects: list[Project],
    llm_provider: str,
    llm_configured: bool,
) -> AskResponse:
    scoped_projects = projects
    scoped_country = mentioned[0] if mentioned else None
    if scoped_country:
        scoped_projects = [project for project in projects if project.iso3 == scoped_country.iso3]

    if not scoped_projects:
        return _response(
            request=question,
            answer="No project records are available for that query.",
            intent="project_summary",
            confidence=0.8,
            sources=[],
            llm_provider=llm_provider,
            llm_configured=llm_configured,
        )

    cluster_totals: dict[str, int] = defaultdict(int)
    cluster_counts: dict[str, int] = defaultdict(int)
    for project in scoped_projects:
        cluster_totals[project.cluster] += project.requested_funds
        cluster_counts[project.cluster] += 1

    ranked_clusters = sorted(cluster_totals.items(), key=lambda item: item[1], reverse=True)[:5]
    scope = scoped_country.country_name if scoped_country else "the loaded crisis dataset"
    cluster_text = ", ".join(
        f"{cluster} ({_usd(amount)}, {cluster_counts[cluster]} projects)" for cluster, amount in ranked_clusters
    )
    sources = [
        AskSource(
            iso3=scoped_country.iso3 if scoped_country else "ALL",
            country_name=scoped_country.country_name if scoped_country else "All loaded countries",
            metric_label=cluster,
            metric_value=_usd(amount),
            description=f"{cluster_counts[cluster]} project records in this cluster.",
        )
        for cluster, amount in ranked_clusters
    ]
    return _response(
        request=question,
        answer=f"For {scope}, the largest project clusters by requested funds are {cluster_text}.",
        intent="project_summary",
        confidence=0.82,
        sources=sources,
        llm_provider=llm_provider,
        llm_configured=llm_configured,
    )


def _ranked_answer(
    request: str,
    intent: str,
    intro: str,
    crises: list[CrisisPoint],
    metric_label: str,
    metric_getter,
    source_description,
    llm_provider: str,
    llm_configured: bool,
) -> AskResponse:
    ranking = "; ".join(
        f"{index}. {crisis.country_name} ({metric_getter(crisis)})" for index, crisis in enumerate(crises, start=1)
    )
    return _response(
        request=request,
        answer=f"{intro}: {ranking}.",
        intent=intent,
        confidence=0.86,
        sources=[_source(crisis, metric_label, metric_getter(crisis), source_description(crisis)) for crisis in crises],
        llm_provider=llm_provider,
        llm_configured=llm_configured,
    )


def _overview_answer(question: str, crises: list[CrisisPoint], llm_provider: str, llm_configured: bool) -> AskResponse:
    people = sum(crisis.people_in_need for crisis in crises)
    gap = sum(crisis.funding_gap_usd for crisis in crises)
    critical = sum(1 for crisis in crises if crisis.severity_class == "critical")
    top_gap = max(crises, key=lambda item: item.funding_gap_usd)
    answer = (
        f"I can answer common crisis-data questions from the loaded dataset. Right now it contains "
        f"{len(crises)} crises, {_whole(people)} people in need, {_usd(gap)} in funding gaps, "
        f"and {critical} critical crises. The largest current funding gap is {top_gap.country_name}."
    )
    return _response(
        request=question,
        answer=answer,
        intent="dataset_overview",
        confidence=0.72,
        sources=[_source(top_gap, "Largest funding gap", _usd(top_gap.funding_gap_usd), top_gap.summary)],
        llm_provider=llm_provider,
        llm_configured=llm_configured,
    )


def _response(
    request: str,
    answer: str,
    intent: str,
    confidence: float,
    sources: list[AskSource],
    llm_provider: str,
    llm_configured: bool,
) -> AskResponse:
    return AskResponse(
        question=request,
        answer=answer,
        intent=intent,
        confidence=confidence,
        sources=sources,
        follow_up_questions=[
            "Which countries have the worst funding gaps?",
            "Show top crises by people in need.",
            "Compare Sudan and Yemen.",
        ],
        llmProvider=llm_provider,
        llmConfigured=llm_configured,
        retrievalMode="rules",
        embeddingProvider="none",
    )


def _find_mentioned_crises(question: str, crises: list[CrisisPoint]) -> list[CrisisPoint]:
    matches: list[CrisisPoint] = []
    tokens = set(re.findall(r"[a-z0-9]+", question))
    for crisis in crises:
        country = _normalize(crisis.country_name)
        crisis_name = _normalize(crisis.crisis_name)
        iso3 = crisis.iso3.lower()
        if iso3 in tokens or country in question or crisis_name in question:
            matches.append(crisis)
    return matches


def _find_by_iso3(crises: list[CrisisPoint], iso3: str) -> CrisisPoint | None:
    normalized_iso3 = iso3.upper()
    return next((crisis for crisis in crises if crisis.iso3 == normalized_iso3), None)


def _is_compare_question(question: str) -> bool:
    return "compare" in question or " vs " in question or " versus " in question or "difference" in question


def _has_any(question: str, terms: list[str]) -> bool:
    return any(term in question for term in terms)


def _normalize(value: str) -> str:
    return re.sub(r"\s+", " ", re.sub(r"[^a-z0-9\s]", " ", value.lower())).strip()


def _source(crisis: CrisisPoint, metric_label: str, metric_value: str, description: str) -> AskSource:
    return AskSource(
        iso3=crisis.iso3,
        countryName=crisis.country_name,
        metricLabel=metric_label,
        metricValue=metric_value,
        description=description,
    )


def _usd(value: int) -> str:
    abs_value = abs(value)
    if abs_value >= 1_000_000_000:
        return f"${value / 1_000_000_000:.1f}B"
    if abs_value >= 1_000_000:
        return f"${value / 1_000_000:.1f}M"
    return f"${value:,}"


def _whole(value: int) -> str:
    return f"{value:,}"


def _percent(value: float) -> str:
    return f"{value:.0%}"
