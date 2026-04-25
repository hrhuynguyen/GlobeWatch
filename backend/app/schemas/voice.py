from app.models.globe import GlobeModel


class VoiceConfigResponse(GlobeModel):
    provider: str
    live_model: str
    live_configured: bool
    fallback_provider: str
    token_endpoint: str


class VoiceLiveTokenResponse(GlobeModel):
    token: str
    live_model: str
    expires_in_seconds: int
    new_session_expires_in_seconds: int
