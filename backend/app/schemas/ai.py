from typing import Optional
from pydantic import BaseModel

class AIGenerateRequest(BaseModel):
    prompt: str
    vibe: Optional[str] = "energetic"

class AIGenerateResponse(BaseModel):
    caption: str
    vibe_tag: str
    emojis: str
    remaining_daily_ai: int

class AIModerateRequest(BaseModel):
    text: str

class AIModerateResponse(BaseModel):
    is_safe: bool
    reason: Optional[str] = "Content looks good!"

class AIChatRequest(BaseModel):
    message: str

class AIChatResponse(BaseModel):
    reply: str
    remaining_daily_ai: int

class AIImageGenerateRequest(BaseModel):
    prompt: str
    width: Optional[int] = 1024
    height: Optional[int] = 1024

class AIImageGenerateResponse(BaseModel):
    image_url: str
    prompt: str
    remaining_daily_ai: int
