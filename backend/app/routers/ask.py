from fastapi import APIRouter

from app.schemas.ask import AskRequest, AskResponse
from app.services.ask_rules import answer_question


router = APIRouter(prefix="/api", tags=["ask"])


@router.post("/ask", response_model=AskResponse)
def ask_question(request: AskRequest) -> AskResponse:
    return answer_question(request)
