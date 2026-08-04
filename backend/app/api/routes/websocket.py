import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
import jwt
from app.core.config import settings
from app.api.dependencies import get_websocket_service
from app.services.websocket_service import WebsocketService

router = APIRouter(tags=["WebSockets"])

@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket, 
    token: str = None, 
    db: Session = Depends(get_db),
    websocket_service: WebsocketService = Depends(get_websocket_service)
):
    if not token:
        await websocket.close(code=1008)
        return
        
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id_str = payload.get("sub")
        if not user_id_str:
            await websocket.close(code=1008)
            return
        user_id = int(user_id_str)
    except Exception:
        await websocket.close(code=1008)
        return

    await websocket_service.connect(websocket, user_id, db)
    
    try:
        while True:
            data = await websocket.receive_text()
            try:
                parsed = json.loads(data)
                
                if parsed.get("type") == "typing":
                    receiver_id = parsed.get("receiver_id")
                    if receiver_id:
                        await websocket_service.send_personal_message({
                            "type": "typing",
                            "sender_id": user_id,
                            "receiver_id": receiver_id
                        }, receiver_id)
                elif parsed.get("type") == "ping":
                    pass 
                else:
                    print(f"Received unknown message from {user_id}: {data}")

            except json.JSONDecodeError:
                print(f"Invalid JSON received from {user_id}: {data}")

    except WebSocketDisconnect:
        await websocket_service.disconnect(websocket, user_id, db)
