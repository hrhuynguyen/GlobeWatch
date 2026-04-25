import os

from app.schemas.ask import AskRequest, AskResponse
from app.services.gemini_client import generate_grounded_answer
from app.services.vector_search import (
    context_from_matches,
    embedding_provider,
    matches_to_ask_sources,
    retrieval_mode,
    semantic_search,
)


def should_use_rag(question: str) -> bool:
    rag_terms = [
        "assist",
        "benchmark",
        "context",
        "intervention",
        "priority",
        "recommend",
        "response",
        "similar",
        "summarize",
        "support",
        "what should",
    ]
    return any(term in question for term in rag_terms)


def answer_with_rag(request: AskRequest, *, llm_provider: str, llm_configured: bool) -> AskResponse:
    selected_iso3 = request.selected_iso3 if request.selected_iso3 else None
    matches = semantic_search(
        request.question,
        year=request.year,
        month=request.month,
        iso3=selected_iso3,
        limit=5,
    )
    if len(matches) < 3 and selected_iso3:
        matches = semantic_search(request.question, year=request.year, month=request.month, limit=5)

    sources = matches_to_ask_sources(matches)
    if not matches:
        answer = "No matching crisis or project records were available for a grounded AI answer."
        confidence = 0.45
    else:
        context = context_from_matches(matches)
        answer = None
        if llm_provider == "gemini" and llm_configured:
            answer = generate_grounded_answer(request.question, context)
        if answer is None:
            answer = _local_grounded_answer(request.question, matches)
        confidence = min(0.88, 0.56 + (matches[0].score * 0.7))

    return AskResponse(
        question=request.question,
        answer=answer,
        intent="rag_answer",
        confidence=round(confidence, 2),
        sources=sources,
        followUpQuestions=[
            "What response priorities stand out?",
            "Find similar project benchmarks.",
            "Which countries have predictive risk signals?",
        ],
        llmProvider=llm_provider,
        llmConfigured=llm_configured,
        retrievalMode=retrieval_mode(),
        embeddingProvider=embedding_provider(),
    )


def _local_grounded_answer(question: str, matches) -> str:
    provider = os.getenv("LLM_PROVIDER", "rule-based")
    lead = "Gemini is not configured, so this is a local RAG fallback" if provider == "gemini" else "Local RAG fallback"
    top_lines = []
    for match in matches[:3]:
        document = match.document
        top_lines.append(
            f"{document.country_name}: {document.metric_label.lower()} is {document.metric_value} "
            f"({document.description})"
        )
    return f"{lead}. The most relevant retrieved records for '{question}' are: " + " ".join(top_lines)
