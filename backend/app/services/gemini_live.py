import datetime as dt
import os

import httpx


DEFAULT_LIVE_MODEL = "gemini-3.1-flash-live-preview"
TOKEN_ENDPOINT = "https://generativelanguage.googleapis.com/v1alpha/authTokens"


def voice_provider() -> str:
    return os.getenv("VOICE_PROVIDER", "browser-speech").strip() or "browser-speech"


def live_model() -> str:
    return os.getenv("GEMINI_LIVE_MODEL", DEFAULT_LIVE_MODEL).strip() or DEFAULT_LIVE_MODEL


def live_configured() -> bool:
    return voice_provider() == "gemini-live" and bool(os.getenv("GEMINI_API_KEY"))


def create_ephemeral_live_token() -> str:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY is required to create a Gemini Live token.")

    now = dt.datetime.now(tz=dt.timezone.utc)
    expire_time = now + dt.timedelta(minutes=30)
    new_session_expire_time = now + dt.timedelta(minutes=1)
    model = live_model()

    payload = {
        "authToken": {
            "uses": 1,
            "expireTime": expire_time.isoformat().replace("+00:00", "Z"),
            "newSessionExpireTime": new_session_expire_time.isoformat().replace("+00:00", "Z"),
            "liveConnectConstraints": {
                "model": model,
                "config": {
                    "temperature": 0.35,
                    "responseModalities": ["AUDIO"],
                    "sessionResumption": {},
                },
            },
        }
    }

    with httpx.Client(timeout=10) as client:
        response = client.post(f"{TOKEN_ENDPOINT}?key={api_key}", json=payload)
        response.raise_for_status()

    token_name = response.json().get("name")
    if not token_name:
        raise RuntimeError("Gemini Live token response did not include a token name.")

    return token_name
