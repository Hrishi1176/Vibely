import json
import datetime
from typing import Dict, List, Set
from fastapi import WebSocket
from sqlalchemy.orm import Session
from app.models.models import User

class ConnectionManager:
    def __init__(self):
        # Maps user_id -> List of active WebSockets
        self.active_connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: int, db: Session):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)

        # Update User Presence in DB to ONLINE
        try:
            user = db.query(User).filter(User.id == user_id).first()
            if user:
                user.is_online = True
                user.last_seen = datetime.datetime.utcnow()
                db.commit()
        except Exception as e:
            print(f"Error updating user online presence: {e}")

        # Broadcast Presence Update to all connected clients
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
            
            # If user has closed all tabs/connections, mark as OFFLINE
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
                try:
                    user = db.query(User).filter(User.id == user_id).first()
                    if user:
                        user.is_online = False
                        user.last_seen = datetime.datetime.utcnow()
                        db.commit()
                except Exception as e:
                    print(f"Error updating user offline presence: {e}")

                # Broadcast Presence Update to all connected clients
                await self.broadcast({
                    "type": "user_presence",
                    "user_id": user_id,
                    "is_online": False,
                    "last_seen": datetime.datetime.utcnow().isoformat()
                })

    async def send_personal_message(self, message: dict, user_id: int):
        """Sends a JSON message to all active sockets of a specific user"""
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
        """Broadcasts a JSON message to ALL active user connections"""
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

manager = ConnectionManager()
