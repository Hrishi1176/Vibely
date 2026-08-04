import os
import shutil
from datetime import datetime
from typing import List, Optional, Dict, Any
from fastapi import BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, desc
from app.models.user import User
from app.models.message import DirectMessage
from app.schemas.message import DirectMessageUpdate
from app.repositories.message_repository import MessageRepository
from app.repositories.user_repository import UserRepository, FollowRepository
from app.services.websocket_service import WebsocketService

class MessageService:
    def __init__(self, message_repo: MessageRepository, user_repo: UserRepository, follow_repo: FollowRepository):
        self.message_repo = message_repo
        self.user_repo = user_repo
        self.follow_repo = follow_repo

    def _message_visible_for_user(self, msg: DirectMessage, current_user: User) -> bool:
        if current_user.id == msg.sender_id and msg.deleted_by_sender and not msg.deleted_by_receiver:
            return False
        if current_user.id == msg.receiver_id and msg.deleted_by_receiver and not msg.deleted_by_sender:
            return False
        return True

    def _serialize_message(self, msg: DirectMessage, current_user: User) -> Optional[dict]:
        if not self._message_visible_for_user(msg, current_user) and not (msg.deleted_by_sender and msg.deleted_by_receiver):
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
            "file_url": getattr(msg, 'file_url', None),
            "is_edited": msg.is_edited,
            "edited_at": msg.edited_at,
            "deleted_by_sender": msg.deleted_by_sender,
            "deleted_by_receiver": msg.deleted_by_receiver,
            "created_at": msg.created_at,
            "sender": msg.sender,
            "receiver": msg.receiver,
        }

    def get_conversations(self, db: Session, current_user: User) -> List[Dict[str, Any]]:
        msg_users = db.query(self.message_repo.model).filter(
            or_(self.message_repo.model.sender_id == current_user.id, self.message_repo.model.receiver_id == current_user.id)
        ).all()

        user_ids = set()
        for m in msg_users:
            if m.sender_id != current_user.id:
                user_ids.add(m.sender_id)
            if m.receiver_id != current_user.id:
                user_ids.add(m.receiver_id)

        following = db.query(self.follow_repo.model).filter(self.follow_repo.model.follower_id == current_user.id).all()
        for f in following:
            user_ids.add(f.following_id)

        conversations = []
        for uid in user_ids:
            u = self.user_repo.get(db, uid)
            if not u:
                continue
            
            messages_between = db.query(self.message_repo.model).filter(
                or_(
                    and_(self.message_repo.model.sender_id == current_user.id, self.message_repo.model.receiver_id == u.id),
                    and_(self.message_repo.model.sender_id == u.id, self.message_repo.model.receiver_id == current_user.id)
                )
            ).order_by(desc(self.message_repo.model.created_at)).all()
            
            last_msg = None
            for msg in messages_between:
                if self._message_visible_for_user(msg, current_user) or (msg.deleted_by_sender and msg.deleted_by_receiver):
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

        conversations.sort(key=lambda x: x["last_message_at"], reverse=True)
        return conversations

    def get_message_thread(self, db: Session, user_id: int, current_user: User) -> List[Dict[str, Any]]:
        target_user = self.user_repo.get(db, user_id)
        if not target_user:
            raise ValueError("User not found")

        messages = self.message_repo.get_messages_between(db, current_user.id, user_id)

        serialized = [
            self._serialize_message(msg, current_user)
            for msg in messages
        ]
        return [msg for msg in serialized if msg is not None]

    def send_message(self, db: Session, user_id: int, current_user: User, 
                    content: Optional[str], image_url: Optional[str], file,
                    background_tasks: BackgroundTasks, websocket_service: WebsocketService) -> DirectMessage:
        if user_id == current_user.id:
            raise ValueError("You cannot send messages to yourself")

        target_user = self.user_repo.get(db, user_id)
        if not target_user:
            raise ValueError("User not found")

        file_url = None
        if file is not None:
            uploads_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), '..', 'uploads', 'messages')
            uploads_dir = os.path.normpath(uploads_dir)
            os.makedirs(uploads_dir, exist_ok=True)
            filename = f"msg_{current_user.id}_{user_id}_{int(datetime.utcnow().timestamp())}_{file.filename}"
            dest_path = os.path.join(uploads_dir, filename)
            with open(dest_path, 'wb') as out_f:
                shutil.copyfileobj(file.file, out_f)
            file_url = f"/uploads/messages/{filename}"

        new_msg = self.message_repo.create(db, obj_in={
            "sender_id": current_user.id,
            "receiver_id": user_id,
            "content": content or "",
            "image_url": image_url,
            "file_url": file_url
        })

        if background_tasks:
            try:
                msg_payload = {
                    "type": "new_message",
                    "id": new_msg.id,
                    "sender_id": new_msg.sender_id,
                    "receiver_id": new_msg.receiver_id,
                    "content": new_msg.content,
                    "image_url": new_msg.image_url,
                    "file_url": file_url,
                    "created_at": new_msg.created_at.isoformat()
                }
                background_tasks.add_task(websocket_service.send_personal_message, msg_payload, new_msg.receiver_id)
                background_tasks.add_task(websocket_service.send_personal_message, msg_payload, new_msg.sender_id)
            except Exception:
                pass

        return new_msg

    def update_message(self, db: Session, message_id: int, msg_in: DirectMessageUpdate, current_user: User,
                       background_tasks: BackgroundTasks, websocket_service: WebsocketService) -> Dict[str, Any]:
        msg = self.message_repo.get(db, message_id)
        if not msg:
            raise ValueError("Message not found")
        if msg.sender_id != current_user.id:
            raise ValueError("Only the sender can edit this message")
        if msg.deleted_by_sender and not msg.deleted_by_receiver:
            raise ValueError("Cannot edit a deleted message")

        if msg_in.content is not None:
            msg.content = msg_in.content
        msg.is_edited = True
        msg.edited_at = datetime.utcnow()
        db.commit()
        db.refresh(msg)

        try:
            msg_payload = {
                "type": "message_updated",
                "id": msg.id,
                "sender_id": msg.sender_id,
                "receiver_id": msg.receiver_id,
                "content": msg.content,
                "image_url": msg.image_url,
                "file_url": getattr(msg, 'file_url', None),
                "is_edited": msg.is_edited,
                "edited_at": msg.edited_at.isoformat() if msg.edited_at else None,
                "created_at": msg.created_at.isoformat()
            }
            background_tasks.add_task(websocket_service.send_personal_message, msg_payload, msg.receiver_id)
            background_tasks.add_task(websocket_service.send_personal_message, msg_payload, msg.sender_id)
        except Exception:
            pass

        return self._serialize_message(msg, current_user)

    def delete_message(self, db: Session, message_id: int, scope: str, current_user: User,
                       background_tasks: BackgroundTasks, websocket_service: WebsocketService) -> Dict[str, Any]:
        msg = self.message_repo.get(db, message_id)
        if not msg:
            raise ValueError("Message not found")
        if current_user.id not in {msg.sender_id, msg.receiver_id}:
            raise ValueError("Not allowed to delete this message")

        if scope == "everyone":
            if current_user.id != msg.sender_id and current_user.id != msg.receiver_id:
                raise ValueError("Not allowed to delete this message for everyone")
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
            msg_payload = {
                "type": "message_deleted",
                "id": msg.id,
                "sender_id": msg.sender_id,
                "receiver_id": msg.receiver_id,
                "deleted_by_sender": msg.deleted_by_sender,
                "deleted_by_receiver": msg.deleted_by_receiver,
                "created_at": msg.created_at.isoformat()
            }
            background_tasks.add_task(websocket_service.send_personal_message, msg_payload, msg.receiver_id)
            background_tasks.add_task(websocket_service.send_personal_message, msg_payload, msg.sender_id)
        except Exception:
            pass

        return {"status": "deleted", "message_id": msg.id, "scope": scope}
