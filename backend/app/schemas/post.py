from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel
from app.schemas.user import UserResponse

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
