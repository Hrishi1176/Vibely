from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr

# Auth Schemas
class UserRegister(BaseModel):
    username: str
    email: EmailStr
    password: str
    full_name: Optional[str] = None

class UserLogin(BaseModel):
    username: str  # Can be username or email
    password: str

class GoogleAuthRequest(BaseModel):
    id_token: Optional[str] = None
    credential: Optional[str] = None
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    sub: Optional[str] = None


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    full_name: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    vibe_badge: str
    is_online: bool = False
    last_seen: Optional[datetime] = None
    created_at: datetime


    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    vibe_badge: Optional[str] = None


# Post & Interaction Schemas
class PostCreate(BaseModel):
    content: str
    image_url: Optional[str] = None
    vibe_tag: Optional[str] = "#Vibely"
    ai_generated: Optional[bool] = False

class CommentCreate(BaseModel):
    content: str

class CommentResponse(BaseModel):
    id: int
    post_id: int
    user_id: int
    content: str
    created_at: datetime
    author: UserResponse

    class Config:
        from_attributes = True

class PostResponse(BaseModel):
    id: int
    user_id: int
    content: str
    image_url: Optional[str] = None
    vibe_tag: Optional[str] = "#Vibely"
    ai_generated: bool
    created_at: datetime
    author: UserResponse
    likes_count: int = 0
    comments_count: int = 0
    is_liked_by_me: bool = False

    class Config:
        from_attributes = True


# AI Service Schemas
class AIGenerateRequest(BaseModel):
    prompt: str
    vibe: Optional[str] = "energetic"  # energetic, chill, professional, witty, reflective

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



# Daily Quota Status Schema
class QuotaStatusResponse(BaseModel):
    date: str
    ai_used: int
    ai_max: int
    ai_remaining: int
    posts_used: int
    posts_max: int
    posts_remaining: int
    images_used: int
    images_max: int
    images_remaining: int


# Messaging Schemas
class DirectMessageCreate(BaseModel):
    content: Optional[str] = ""
    image_url: Optional[str] = None

class DirectMessageUpdate(BaseModel):
    content: Optional[str] = None

class DirectMessageResponse(BaseModel):
    id: int
    sender_id: int
    receiver_id: int
    content: Optional[str] = None
    image_url: Optional[str] = None
    file_url: Optional[str] = None
    is_edited: bool = False
    edited_at: Optional[datetime] = None
    deleted_by_sender: bool = False
    deleted_by_receiver: bool = False
    created_at: datetime
    sender: UserResponse
    receiver: UserResponse

    class Config:
        from_attributes = True

