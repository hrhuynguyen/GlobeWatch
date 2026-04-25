import os

import httpx


GEMINI_GENERATE_URL = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"


def gemini_configured() -> bool:
    return bool(os.getenv("GEMINI_API_KEY"))


def gemini_model() -> str:
    return os.getenv("GEMINI_MODEL", "gemini-2.5-flash")


def generate_grounded_answer(question: str, context: str) -> str | None:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return None

    prompt = (
        "You are GlobeWatch, a humanitarian crisis analysis assistant. "
        "Answer only from the provided retrieved records. If the records do not support a claim, say so. "
        "Keep the answer under 140 words and mention the most relevant countries or project clusters.\n\n"
        f"User question:\n{question}\n\n"
        f"Retrieved records:\n{context}"
    )
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.2,
            "maxOutputTokens": 220,
        },
    }

    try:
        with httpx.Client(timeout=12) as client:
            response = client.post(
                GEMINI_GENERATE_URL.format(model=gemini_model()),
                headers={
                    "Content-Type": "application/json",
                    "x-goog-api-key": api_key,
                },
                json=payload,
            )
            response.raise_for_status()
    except httpx.HTTPError:
        return None

    data = response.json()
    parts = data.get("candidates", [{}])[0].get("content", {}).get("parts", [])
    text = " ".join(part.get("text", "") for part in parts).strip()
    return text or None
