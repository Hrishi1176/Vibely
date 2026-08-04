from typing import Optional
from sqlalchemy.orm import Session
from app.models.user import User, Follow, UserQuota
from app.schemas.user import UserRegister, UserUpdate
from app.repositories.base_repository import BaseRepository

class UserRepository(BaseRepository[User, UserRegister, UserUpdate]):
    def __init__(self):
        super().__init__(User)
        
    def get_by_username(self, db: Session, username: str) -> Optional[User]:
        return db.query(self.model).filter(self.model.username == username).first()
        
    def get_by_email(self, db: Session, email: str) -> Optional[User]:
        return db.query(self.model).filter(self.model.email == email).first()

    def get_by_google_id(self, db: Session, google_id: str) -> Optional[User]:
        return db.query(self.model).filter(self.model.google_id == google_id).first()


class FollowRepository(BaseRepository[Follow, dict, dict]):
    def __init__(self):
        super().__init__(Follow)

    def get_follow(self, db: Session, follower_id: int, following_id: int) -> Optional[Follow]:
        return db.query(self.model).filter(
            self.model.follower_id == follower_id,
            self.model.following_id == following_id
        ).first()

class UserQuotaRepository(BaseRepository[UserQuota, dict, dict]):
    def __init__(self):
        super().__init__(UserQuota)
        
    def get_quota(self, db: Session, user_id: int, date_str: str) -> Optional[UserQuota]:
        return db.query(self.model).filter(
            self.model.user_id == user_id,
            self.model.date_str == date_str
        ).first()
