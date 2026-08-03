from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import User
from app.schemas.schemas import (
    AIGenerateRequest, AIGenerateResponse,
    AIModerateRequest, AIModerateResponse,
    AIChatRequest, AIChatResponse,
    AIImageGenerateRequest, AIImageGenerateResponse
)
from app.api.deps import get_current_user
from app.services.quota_manager import QuotaManager
from app.services.groq_ai import GroqAIService

router = APIRouter(prefix="/ai", tags=["AI Engine (Groq / Llama 3 / Image)"])

@router.post("/generate-caption", response_model=AIGenerateResponse)
def generate_ai_caption(req: AIGenerateRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Enforce Daily AI Limit
    remaining_ai = QuotaManager.check_and_increment_ai(db, current_user.id)
    
    # Generate caption via Groq AI (Llama 3 8B)
    ai_result = GroqAIService.generate_caption(req.prompt, req.vibe or "energetic")
    
    return {
        "caption": ai_result["caption"],
        "vibe_tag": ai_result["vibe_tag"],
        "emojis": ai_result["emojis"],
        "remaining_daily_ai": remaining_ai
    }

@router.post("/moderate", response_model=AIModerateResponse)
def moderate_text(req: AIModerateRequest):
    result = GroqAIService.moderate_content(req.text)
    return {
        "is_safe": result["is_safe"],
        "reason": result["reason"]
    }

@router.post("/assistant", response_model=AIChatResponse)
def chat_with_vibe_ai(req: AIChatRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Enforce Daily AI Limit
    remaining_ai = QuotaManager.check_and_increment_ai(db, current_user.id)
    
    reply = GroqAIService.chat_assistant(req.message)
    return {
        "reply": reply,
        "remaining_daily_ai": remaining_ai
    }

@router.post("/generate-image", response_model=AIImageGenerateResponse)
def generate_ai_image(req: AIImageGenerateRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Enforce Daily AI Limit
    remaining_ai = QuotaManager.check_and_increment_ai(db, current_user.id)

    image_url = GroqAIService.generate_image(req.prompt, req.width or 1024, req.height or 1024)

    return {
        "image_url": image_url,
        "prompt": req.prompt,
        "remaining_daily_ai": remaining_ai
    }

