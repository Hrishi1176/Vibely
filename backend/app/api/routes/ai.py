from fastapi import HTTPException
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.schemas.ai import (
    AIGenerateRequest, AIGenerateResponse, 
    AIModerateRequest, AIModerateResponse,
    AIChatRequest, AIChatResponse,
    AIImageGenerateRequest, AIImageGenerateResponse
)
from app.api.dependencies import get_current_user, get_ai_service, get_quota_service
from app.services.ai_service import AiService
from app.services.quota_service import QuotaService

router = APIRouter(prefix="/ai", tags=["AI Integration"])

@router.post("/generate", response_model=AIGenerateResponse)
def generate_post_caption(
    req: AIGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    ai_service: AiService = Depends(get_ai_service),
    quota_service: QuotaService = Depends(get_quota_service)
):
    try:
        quota, remaining = quota_service.check_and_increment_ai(db, current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=429, detail=str(e))
    result = ai_service.generate_caption(req.prompt, req.vibe)
    result["remaining_daily_ai"] = remaining
    return result

@router.post("/moderate", response_model=AIModerateResponse)
def moderate_text(
    req: AIModerateRequest,
    ai_service: AiService = Depends(get_ai_service)
):
    return ai_service.moderate_content(req.text)

@router.post("/chat", response_model=AIChatResponse)
def chat_with_vibeai(
    req: AIChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    ai_service: AiService = Depends(get_ai_service),
    quota_service: QuotaService = Depends(get_quota_service)
):
    try:
        quota, remaining = quota_service.check_and_increment_ai(db, current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=429, detail=str(e))
    reply = ai_service.chat_assistant(req.message)
    return {
        "reply": reply,
        "remaining_daily_ai": remaining
    }

@router.post("/image", response_model=AIImageGenerateResponse)
def generate_image_ai(
    req: AIImageGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    ai_service: AiService = Depends(get_ai_service),
    quota_service: QuotaService = Depends(get_quota_service)
):
    try:
        quota, remaining = quota_service.check_and_increment_image(db, current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=429, detail=str(e))
    image_url = ai_service.generate_image(req.prompt, req.width, req.height)
    return {
        "image_url": image_url,
        "prompt": req.prompt,
        "remaining_daily_ai": remaining
    }
