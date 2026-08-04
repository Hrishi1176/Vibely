from typing import Optional, List
from sqlalchemy.orm import Session
from app.models.post import Post, Comment, Like
from app.schemas.post import PostCreate, CommentCreate
from app.repositories.base_repository import BaseRepository

class PostRepository(BaseRepository[Post, PostCreate, dict]):
    def __init__(self):
        super().__init__(Post)


class CommentRepository(BaseRepository[Comment, CommentCreate, dict]):
    def __init__(self):
        super().__init__(Comment)

    def get_by_post(self, db: Session, post_id: int) -> List[Comment]:
        return db.query(self.model).filter(self.model.post_id == post_id).all()


class LikeRepository(BaseRepository[Like, dict, dict]):
    def __init__(self):
        super().__init__(Like)

    def get_like(self, db: Session, post_id: int, user_id: int) -> Optional[Like]:
        return db.query(self.model).filter(
            self.model.post_id == post_id,
            self.model.user_id == user_id
        ).first()
