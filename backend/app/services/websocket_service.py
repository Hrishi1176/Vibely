import json
import datetime
from typing import Dict, List
from fastapi import WebSocket
from sqlalchemy.orm import Session
from app.repositories.user_repository import UserRepository

class WebsocketService:
    def __init__(self, user_repo: UserRepository):
        self.active_connections: Dict[int, List[WebSocket]] = {}
        self.user_repo = user_repo

    async def connect(self, websocket: WebSocket, user_id: int, db: Session):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)

        try:
            user = self.user_repo.get(db, user_id)
            if user:
                user.is_online = True
                user.last_seen = datetime.datetime.utcnow()
                db.commit()
        except Exception as e:
            print(f"Error updating user online presence: {e}")

        await self.broadcast({
            "type": "user_presence",
            "user_id": user_id,
            "is_online": True,
            "last_seen": datetime.datetime.utcnow().isoformat()
        })

    async def disconnect(self, websocket: WebSocket, user_id: int, db: Session):
        if user_id in self.active_connections:
            if websocket in self.active_connections[user_id]:
                self.active_connections[user_id].remove(websocket)
            
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
                try:
                    user = self.user_repo.get(db, user_id)
                    if user:
                        user.is_online = False
                        user.last_seen = datetime.datetime.utcnow()
                        db.commit()
                except Exception as e:
                    print(f"Error updating user offline presence: {e}")

                await self.broadcast({
                    "type": "user_presence",
                    "user_id": user_id,
                    "is_online": False,
                    "last_seen": datetime.datetime.utcnow().isoformat()
                })

    async def send_personal_message(self, message: dict, user_id: int):
        if user_id in self.active_connections:
            dead_sockets = []
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_text(json.dumps(message))
                except Exception:
                    dead_sockets.append(connection)
            
            for dead in dead_sockets:
                self.active_connections[user_id].remove(dead)

    async def broadcast(self, message: dict):
        payload = json.dumps(message)
        for user_id, connections in list(self.active_connections.items()):
            dead_sockets = []
            for connection in connections:
                try:
                    await connection.send_text(payload)
                except Exception:
                    dead_sockets.append(connection)
            for dead in dead_sockets:
                connections.remove(dead)

# Singleton instance
from app.repositories.user_repository import UserRepository
websocket_service_instance = WebsocketService(UserRepository())
