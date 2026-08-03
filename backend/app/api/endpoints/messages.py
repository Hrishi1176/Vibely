from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, desc
from app.core.database import get_db
from app.models.models import User, DirectMessage, Follow
from app.schemas.schemas import DirectMessageCreate, DirectMessageResponse, DirectMessageUpdate
from app.api.deps import get_current_user
from app.services.websocket_manager import manager

router = APIRouter(prefix="/messages", tags=["Direct Messaging"])

def _message_visible_for_user(msg: DirectMessage, current_user: User) -> bool:
    if current_user.id == msg.sender_id and msg.deleted_by_sender and not msg.deleted_by_receiver:
        return False
    if current_user.id == msg.receiver_id and msg.deleted_by_receiver and not msg.deleted_by_sender:
        return False
    return True


def _serialize_message(msg: DirectMessage, current_user: User) -> Optional[dict]:
    if not _message_visible_for_user(msg, current_user) and not (msg.deleted_by_sender and msg.deleted_by_receiver):
        return None

    if msg.deleted_by_sender and msg.deleted_by_receiver:
        return {
            "id": msg.id,
            "sender_id": msg.sender_id,
            "receiver_id": msg.receiver_id,
            "content": "This message was deleted.",
            "image_url": None,
            "is_edited": msg.is_edited,
            "edited_at": msg.edited_at,
            "deleted_by_sender": msg.deleted_by_sender,
            "deleted_by_receiver": msg.deleted_by_receiver,
            "created_at": msg.created_at,
            "sender": msg.sender,
            "receiver": msg.receiver,
        }

    return {
        "id": msg.id,
        "sender_id": msg.sender_id,
        "receiver_id": msg.receiver_id,
        "content": msg.content,
        "image_url": msg.image_url,
        "is_edited": msg.is_edited,
        "edited_at": msg.edited_at,
        "deleted_by_sender": msg.deleted_by_sender,
        "deleted_by_receiver": msg.deleted_by_receiver,
        "created_at": msg.created_at,
        "sender": msg.sender,
        "receiver": msg.receiver,
    }


@router.get("/conversations")
def get_conversations(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Find all users that current_user has exchanged messages with
    msg_users = db.query(DirectMessage).filter(
        or_(DirectMessage.sender_id == current_user.id, DirectMessage.receiver_id == current_user.id)
    ).all()

    user_ids = set()
    for m in msg_users:
        if m.sender_id != current_user.id:
            user_ids.add(m.sender_id)
        if m.receiver_id != current_user.id:
            user_ids.add(m.receiver_id)

    # Also include users that current_user is following so they can start a conversation right away
    following = db.query(Follow).filter(Follow.follower_id == current_user.id).all()
    for f in following:
        user_ids.add(f.following_id)

    conversations = []
    for uid in user_ids:
        u = db.query(User).filter(User.id == uid).first()
        if not u:
            continue
        last_msg = None
        messages_between = db.query(DirectMessage).filter(
            or_(
                and_(DirectMessage.sender_id == current_user.id, DirectMessage.receiver_id == u.id),
                and_(DirectMessage.sender_id == u.id, DirectMessage.receiver_id == current_user.id)
            )
        ).order_by(desc(DirectMessage.created_at)).all()
        for msg in messages_between:
            if _message_visible_for_user(msg, current_user) or (msg.deleted_by_sender and msg.deleted_by_receiver):
                last_msg = msg
                break

        conversations.append({
            "user": {
                "id": u.id,
                "username": u.username,
                "full_name": u.full_name,
                "avatar_url": u.avatar_url,
                "vibe_badge": u.vibe_badge,
                "is_online": u.is_online,
                "last_seen": u.last_seen.isoformat() if u.last_seen else None
            },
            "last_message": last_msg.content if last_msg else "Start a conversation ✨",
            "last_message_at": last_msg.created_at.isoformat() if last_msg else u.created_at.isoformat(),
            "is_last_from_me": last_msg.sender_id == current_user.id if last_msg else False
        })

    # Sort conversations by last message timestamp descending
    conversations.sort(key=lambda x: x["last_message_at"], reverse=True)
    return conversations

@router.get("/{user_id}", response_model=List[DirectMessageResponse])
def get_message_thread(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    messages = db.query(DirectMessage).filter(
        or_(
            and_(DirectMessage.sender_id == current_user.id, DirectMessage.receiver_id == user_id),
            and_(DirectMessage.sender_id == user_id, DirectMessage.receiver_id == current_user.id)
        )
    ).order_by(DirectMessage.created_at.asc()).all()

    serialized = [
        _serialize_message(msg, current_user)
        for msg in messages
    ]
    return [msg for msg in serialized if msg is not None]

@router.post("/{user_id}", response_model=DirectMessageResponse, status_code=status.HTTP_201_CREATED)
def send_message(user_id: int, msg_in: DirectMessageCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot send messages to yourself")

    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    new_msg = DirectMessage(
        sender_id=current_user.id,
        receiver_id=user_id,
        content=msg_in.content,
        image_url=msg_in.image_url
    )
    db.add(new_msg)
    db.commit()
    db.refresh(new_msg)

    try:
        manager.send_personal_message({
            "type": "new_message",
            "id": new_msg.id,
            "sender_id": new_msg.sender_id,
            "receiver_id": new_msg.receiver_id,
            "content": new_msg.content,
            "image_url": new_msg.image_url,
            "created_at": new_msg.created_at.isoformat()
        }, new_msg.receiver_id)
        manager.send_personal_message({
            "type": "new_message",
            "id": new_msg.id,
            "sender_id": new_msg.sender_id,
            "receiver_id": new_msg.receiver_id,
            "content": new_msg.content,
            "image_url": new_msg.image_url,
            "created_at": new_msg.created_at.isoformat()
        }, new_msg.sender_id)
    except Exception:
        pass

    return new_msg

@router.patch("/{message_id}", response_model=DirectMessageResponse)
def update_message(message_id: int, msg_in: DirectMessageUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    msg = db.query(DirectMessage).filter(DirectMessage.id == message_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    if msg.sender_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the sender can edit this message")
    if msg.deleted_by_sender and not msg.deleted_by_receiver:
        raise HTTPException(status_code=400, detail="Cannot edit a deleted message")

    if msg_in.content is not None:
        msg.content = msg_in.content
    msg.is_edited = True
    msg.edited_at = datetime.utcnow()
    db.commit()
    db.refresh(msg)

    try:
        manager.send_personal_message({
            "type": "message_updated",
            "id": msg.id,
            "sender_id": msg.sender_id,
            "receiver_id": msg.receiver_id,
            "content": msg.content,
            "image_url": msg.image_url,
            "is_edited": msg.is_edited,
            "edited_at": msg.edited_at.isoformat() if msg.edited_at else None,
            "created_at": msg.created_at.isoformat()
        }, msg.receiver_id)
        manager.send_personal_message({
            "type": "message_updated",
            "id": msg.id,
            "sender_id": msg.sender_id,
            "receiver_id": msg.receiver_id,
            "content": msg.content,
            "image_url": msg.image_url,
            "is_edited": msg.is_edited,
            "edited_at": msg.edited_at.isoformat() if msg.edited_at else None,
            "created_at": msg.created_at.isoformat()
        }, msg.sender_id)
    except Exception:
        pass

    return _serialize_message(msg, current_user)

@router.delete("/{message_id}")
def delete_message(message_id: int, scope: str = "me", db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    msg = db.query(DirectMessage).filter(DirectMessage.id == message_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    if current_user.id not in {msg.sender_id, msg.receiver_id}:
        raise HTTPException(status_code=403, detail="Not allowed to delete this message")

    if scope == "everyone":
        if current_user.id != msg.sender_id and current_user.id != msg.receiver_id:
            raise HTTPException(status_code=403, detail="Not allowed to delete this message for everyone")
        msg.deleted_by_sender = True
        msg.deleted_by_receiver = True
    else:
        if current_user.id == msg.sender_id:
            msg.deleted_by_sender = True
        else:
            msg.deleted_by_receiver = True

    db.commit()
    db.refresh(msg)

    try:
        manager.send_personal_message({
            "type": "message_deleted",
            "id": msg.id,
            "sender_id": msg.sender_id,
            "receiver_id": msg.receiver_id,
            "deleted_by_sender": msg.deleted_by_sender,
            "deleted_by_receiver": msg.deleted_by_receiver,
            "created_at": msg.created_at.isoformat()
        }, msg.receiver_id)
        manager.send_personal_message({
            "type": "message_deleted",
            "id": msg.id,
            "sender_id": msg.sender_id,
            "receiver_id": msg.receiver_id,
            "deleted_by_sender": msg.deleted_by_sender,
            "deleted_by_receiver": msg.deleted_by_receiver,
            "created_at": msg.created_at.isoformat()
        }, msg.sender_id)
    except Exception:
        pass

    return {"status": "deleted", "message_id": msg.id, "scope": scope}
