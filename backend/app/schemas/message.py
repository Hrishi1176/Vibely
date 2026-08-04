from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from app.schemas.user import UserResponse

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
