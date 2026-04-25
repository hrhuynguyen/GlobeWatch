from app.schemas.ai import BenchmarkRequest, BenchmarkResponse
from app.services.vector_search import embedding_provider, retrieval_mode, vector_matches


def benchmark_projects(request: BenchmarkRequest) -> BenchmarkResponse:
    matches = vector_matches(
        request.query,
        year=request.year,
        month=request.month,
        iso3=request.iso3,
        limit=request.limit,
    )

    if not matches:
        insight = "No matching crisis or project records were found for this benchmark query."
    else:
        project_matches = [match for match in matches if match.record_type == "project"]
        crisis_matches = [match for match in matches if match.record_type == "crisis"]
        top = matches[0]
        insight = (
            f"The closest benchmark is {top.title} in {top.country_name} "
            f"({top.metric_label}: {top.metric_value}, score {top.score:.2f}). "
            f"Retrieved {len(project_matches)} project records and {len(crisis_matches)} crisis records."
        )

    return BenchmarkResponse(
        query=request.query,
        retrievalMode=retrieval_mode(),
        embeddingProvider=embedding_provider(),
        matches=matches,
        insight=insight,
    )
