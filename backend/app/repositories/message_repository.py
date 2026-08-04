from typing import List
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, desc
from app.models.message import DirectMessage
from app.schemas.message import DirectMessageCreate, DirectMessageUpdate
from app.repositories.base_repository import BaseRepository

class MessageRepository(BaseRepository[DirectMessage, DirectMessageCreate, DirectMessageUpdate]):
    def __init__(self):
        super().__init__(DirectMessage)

    def get_messages_between(self, db: Session, user1_id: int, user2_id: int) -> List[DirectMessage]:
        return db.query(self.model).filter(
            or_(
                and_(self.model.sender_id == user1_id, self.model.receiver_id == user2_id),
                and_(self.model.sender_id == user2_id, self.model.receiver_id == user1_id)
            )
        ).order_by(self.model.created_at.asc()).all()

    def get_last_message_between(self, db: Session, user1_id: int, user2_id: int) -> DirectMessage:
        return db.query(self.model).filter(
            or_(
                and_(self.model.sender_id == user1_id, self.model.receiver_id == user2_id),
                and_(self.model.sender_id == user2_id, self.model.receiver_id == user1_id)
            )
        ).order_by(desc(self.model.created_at)).first()
