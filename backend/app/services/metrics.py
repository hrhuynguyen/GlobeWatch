def clamp(value: float, minimum: float, maximum: float) -> float:
    return max(minimum, min(maximum, value))


def funding_gap(requested: int, received: int) -> int:
    return max(0, requested - received)


def coverage_ratio(requested: int, received: int) -> float:
    if requested <= 0:
        return 0
    return round(clamp(received / requested, 0, 1), 3)


def funding_per_capita(received: int, people_in_need: int) -> float:
    if people_in_need <= 0:
        return 0
    return round(received / people_in_need, 2)


def severity_score(requested: int, gap: int, people_in_need: int) -> int:
    request_pressure = clamp(requested / 3_000_000_000, 0, 1)
    gap_pressure = clamp(gap / 2_500_000_000, 0, 1)
    need_pressure = clamp(people_in_need / 30_000_000, 0, 1)
    return round(45 + request_pressure * 20 + gap_pressure * 25 + need_pressure * 10)


def severity_class(score: int) -> str:
    if score >= 90:
        return "critical"
    if score >= 82:
        return "severe"
    if score >= 72:
        return "high"
    return "moderate"


def oversight_score(score: int, coverage: float) -> int:
    return round(score * (1 - coverage))

