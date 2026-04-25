from fastapi import APIRouter, HTTPException, status

from app.schemas.voice import VoiceConfigResponse, VoiceLiveTokenResponse
from app.services.gemini_live import create_ephemeral_live_token, live_configured, live_model, voice_provider

router = APIRouter(prefix="/api/voice", tags=["voice"])


@router.get("/config", response_model=VoiceConfigResponse)
def get_voice_config() -> VoiceConfigResponse:
    return VoiceConfigResponse(
        provider=voice_provider(),
        live_model=live_model(),
        live_configured=live_configured(),
        fallback_provider="web-speech-api",
        token_endpoint="/api/voice/live-token",
    )


@router.post("/live-token", response_model=VoiceLiveTokenResponse)
def create_live_token() -> VoiceLiveTokenResponse:
    if not live_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Gemini Live is not configured. Set VOICE_PROVIDER=gemini-live and GEMINI_API_KEY.",
        )

    try:
        token = create_ephemeral_live_token()
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Unable to create Gemini Live token: {exc}",
        ) from exc

    return VoiceLiveTokenResponse(
        token=token,
        live_model=live_model(),
        expires_in_seconds=1800,
        new_session_expires_in_seconds=60,
    )
