from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, BackgroundTasks
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.schemas.message import DirectMessageResponse, DirectMessageUpdate
from app.api.dependencies import get_current_user, get_message_service, get_websocket_service
from app.services.message_service import MessageService
from app.services.websocket_service import WebsocketService

router = APIRouter(prefix="/messages", tags=["Direct Messaging"])

@router.get("/conversations")
def get_conversations(
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user),
    message_service: MessageService = Depends(get_message_service)
):
    return message_service.get_conversations(db, current_user)

@router.get("/{user_id}", response_model=List[DirectMessageResponse])
def get_message_thread(
    user_id: int, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user),
    message_service: MessageService = Depends(get_message_service)
):
    try:
        return message_service.get_message_thread(db, user_id, current_user)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/{user_id}", response_model=DirectMessageResponse, status_code=status.HTTP_201_CREATED)
def send_message(
    user_id: int,
    content: Optional[str] = Form(None),
    image_url: Optional[str] = Form(None),
    file: UploadFile = File(None),
    background_tasks: BackgroundTasks = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    message_service: MessageService = Depends(get_message_service),
    websocket_service: WebsocketService = Depends(get_websocket_service)
):
    try:
        return message_service.send_message(
            db, user_id, current_user, content, image_url, file, background_tasks, websocket_service
        )
    except ValueError as e:
        if str(e) == "User not found":
            raise HTTPException(status_code=404, detail=str(e))
        raise HTTPException(status_code=400, detail=str(e))

@router.patch("/{message_id}", response_model=DirectMessageResponse)
def update_message(
    message_id: int, 
    msg_in: DirectMessageUpdate, 
    background_tasks: BackgroundTasks, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user),
    message_service: MessageService = Depends(get_message_service),
    websocket_service: WebsocketService = Depends(get_websocket_service)
):
    try:
        return message_service.update_message(db, message_id, msg_in, current_user, background_tasks, websocket_service)
    except ValueError as e:
        if str(e) == "Message not found":
            raise HTTPException(status_code=404, detail=str(e))
        elif str(e) == "Only the sender can edit this message":
            raise HTTPException(status_code=403, detail=str(e))
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{message_id}")
def delete_message(
    message_id: int, 
    background_tasks: BackgroundTasks, 
    scope: str = "me", 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user),
    message_service: MessageService = Depends(get_message_service),
    websocket_service: WebsocketService = Depends(get_websocket_service)
):
    try:
        return message_service.delete_message(db, message_id, scope, current_user, background_tasks, websocket_service)
    except ValueError as e:
        if str(e) == "Message not found":
            raise HTTPException(status_code=404, detail=str(e))
        raise HTTPException(status_code=403, detail=str(e))
