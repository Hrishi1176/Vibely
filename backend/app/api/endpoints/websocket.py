import json
import datetime
from typing import Optional
import os
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query, status
from sqlalchemy.orm import Session
import jwt

from app.core.config import settings
from app.core.database import SessionLocal, get_db
from app.models.models import User, DirectMessage
from app.services.websocket_manager import manager

router = APIRouter(prefix="/ws", tags=["Real-time WebSockets & Presence"])

def get_user_from_token(token: str, db: Session) -> Optional[User]:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id_str: str = payload.get("sub")
        if not user_id_str:
            return None
        return db.query(User).filter(User.id == int(user_id_str)).first()
    except Exception:
        return None

@router.websocket("/chat")
async def websocket_chat_endpoint(websocket: WebSocket, token: Optional[str] = Query(None)):
    db = SessionLocal()
    try:
        # Extract JWT token from Cookie first, or query param fallback
        auth_token = websocket.cookies.get("vibely_token") or token
        if not auth_token:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return

        current_user = get_user_from_token(auth_token, db)
        if not current_user:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return

        # Accept connection & broadcast ONLINE status
        await manager.connect(websocket, current_user.id, db)

        while True:
            data_text = await websocket.receive_text()
            try:
                data = json.loads(data_text)
                msg_type = data.get("type")

                if msg_type == "chat_message":
                    receiver_id = int(data.get("receiver_id"))
                    content = str(data.get("content", "")).strip()
                    image_url = data.get("image_url")

                    if (content or image_url) and receiver_id:
                        # Save message in DB
                        new_msg = DirectMessage(
                            sender_id=current_user.id,
                            receiver_id=receiver_id,
                            content=content,
                            image_url=image_url,
                            created_at=datetime.datetime.utcnow()
                        )
                        db.add(new_msg)
                        db.commit()
                        db.refresh(new_msg)

                        msg_payload = {
                            "type": "new_message",
                            "id": new_msg.id,
                            "sender_id": current_user.id,
                            "receiver_id": receiver_id,
                            "content": new_msg.content,
                            "image_url": new_msg.image_url,
                            "created_at": new_msg.created_at.isoformat()
                        }

                        # Send to receiver & sender in real-time
                        await manager.send_personal_message(msg_payload, receiver_id)
                        await manager.send_personal_message(msg_payload, current_user.id)

                elif msg_type == "typing":
                    receiver_id = int(data.get("receiver_id"))
                    is_typing = bool(data.get("is_typing", False))

                    await manager.send_personal_message({
                        "type": "user_typing",
                        "sender_id": current_user.id,
                        "is_typing": is_typing
                    }, receiver_id)

                elif msg_type == "ping":
                    await websocket.send_text(json.dumps({"type": "pong"}))

                elif msg_type == "chat_message_binary":
                    # Expect a following binary frame containing the file bytes
                    receiver_id = int(data.get("receiver_id"))
                    filename = data.get("filename") or f"voice-{int(datetime.datetime.utcnow().timestamp())}.webm"
                    mime_type = data.get("mime_type") or "application/octet-stream"
                    content = data.get("content", "")

                    try:
                        # Receive next frame (should be bytes)
                        raw = await websocket.receive()
                        file_bytes = raw.get("bytes")
                        if not file_bytes:
                            continue

                        # Save file to uploads/messages
                        uploads_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), '..', 'uploads', 'messages')
                        uploads_dir = os.path.normpath(uploads_dir)
                        os.makedirs(uploads_dir, exist_ok=True)
                        safe_name = f"ws_{current_user.id}_{receiver_id}_{int(datetime.datetime.utcnow().timestamp())}_{filename}"
                        dest_path = os.path.join(uploads_dir, safe_name)
                        with open(dest_path, 'wb') as f:
                            f.write(file_bytes)

                        file_url = f"/uploads/messages/{safe_name}"

                        # Save message record
                        new_msg = DirectMessage(
                            sender_id=current_user.id,
                            receiver_id=receiver_id,
                            content=content,
                            file_url=file_url,
                            created_at=datetime.datetime.utcnow()
                        )
                        db.add(new_msg)
                        db.commit()
                        db.refresh(new_msg)

                        msg_payload = {
                            "type": "new_message",
                            "id": new_msg.id,
                            "sender_id": current_user.id,
                            "receiver_id": receiver_id,
                            "content": new_msg.content,
                            "image_url": new_msg.image_url,
                            "file_url": new_msg.file_url,
                            "created_at": new_msg.created_at.isoformat()
                        }

                        await manager.send_personal_message(msg_payload, receiver_id)
                        await manager.send_personal_message(msg_payload, current_user.id)

                    except Exception as e:
                        print(f"Error handling binary chat message: {e}")

            except Exception as e:
                print(f"Error handling WebSocket message: {e}")

    except WebSocketDisconnect:
        if 'current_user' in locals() and current_user:
            await manager.disconnect(websocket, current_user.id, db)
    finally:
        db.close()
