from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from app.models.user import User
from app.schemas.user import UserUpdate
from app.repositories.user_repository import UserRepository, FollowRepository
from app.repositories.post_repository import PostRepository

class UserService:
    def __init__(self, user_repo: UserRepository, follow_repo: FollowRepository, post_repo: PostRepository):
        self.user_repo = user_repo
        self.follow_repo = follow_repo
        self.post_repo = post_repo

    def update_profile(self, db: Session, current_user: User, user_update: UserUpdate) -> User:
        return self.user_repo.update(db, db_obj=current_user, obj_in=user_update)

    def search_users(self, db: Session, q: str, current_user: Optional[User] = None) -> List[Dict[str, Any]]:
        if not q.strip():
            users = db.query(self.user_repo.model).limit(20).all()
        else:
            query_str = f"%{q.strip().lower()}%"
            users = db.query(self.user_repo.model).filter(
                (self.user_repo.model.username.ilike(query_str)) | (self.user_repo.model.full_name.ilike(query_str))
            ).limit(20).all()

        results = []
        for u in users:
            is_following = False
            if current_user and current_user.id != u.id:
                is_following = self.follow_repo.get_follow(db, current_user.id, u.id) is not None
            results.append({
                "id": u.id,
                "username": u.username,
                "full_name": u.full_name,
                "bio": u.bio,
                "avatar_url": u.avatar_url,
                "vibe_badge": u.vibe_badge,
                "is_following": is_following,
                "is_me": current_user.id == u.id if current_user else False
            })
        return results

    def get_user_suggestions(self, db: Session, current_user: Optional[User] = None) -> List[Dict[str, Any]]:
        all_users = db.query(self.user_repo.model).order_by(self.user_repo.model.id.desc()).limit(30).all()
        results = []
        for u in all_users:
            if current_user and u.id == current_user.id:
                continue
            is_following = False
            if current_user:
                is_following = self.follow_repo.get_follow(db, current_user.id, u.id) is not None
            results.append({
                "id": u.id,
                "username": u.username,
                "full_name": u.full_name,
                "bio": u.bio,
                "avatar_url": u.avatar_url,
                "vibe_badge": u.vibe_badge,
                "is_following": is_following,
                "is_online": u.is_online,
            })
        return results

    def toggle_follow(self, db: Session, current_user: User, user_id: int) -> Dict[str, Any]:
        if user_id == current_user.id:
            raise ValueError("You cannot follow yourself")

        target_user = self.user_repo.get(db, user_id)
        if not target_user:
            raise ValueError("User not found")

        existing_follow = self.follow_repo.get_follow(db, current_user.id, user_id)

        if existing_follow:
            self.follow_repo.delete(db, id=existing_follow.id)
            return {"following": False, "is_following": False, "message": f"Unfollowed {target_user.username}"}
        else:
            self.follow_repo.create(db, obj_in={"follower_id": current_user.id, "following_id": user_id})
            return {"following": True, "is_following": True, "message": f"Following {target_user.username}"}

    def get_user_profile(self, db: Session, username: str, current_user: Optional[User] = None) -> Optional[Dict[str, Any]]:
        user = self.user_repo.get_by_username(db, username.lower())
        if not user:
            return None

        posts_count = db.query(self.post_repo.model).filter(self.post_repo.model.user_id == user.id).count()
        followers_count = db.query(self.follow_repo.model).filter(self.follow_repo.model.following_id == user.id).count()
        following_count = db.query(self.follow_repo.model).filter(self.follow_repo.model.follower_id == user.id).count()

        is_following = False
        if current_user and current_user.id != user.id:
            is_following = self.follow_repo.get_follow(db, current_user.id, user.id) is not None

        return {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "full_name": user.full_name,
            "bio": user.bio,
            "avatar_url": user.avatar_url,
            "vibe_badge": user.vibe_badge,
            "is_online": user.is_online,
            "last_seen": user.last_seen,
            "created_at": user.created_at,
            "posts_count": posts_count,
            "followers_count": followers_count,
            "following_count": following_count,
            "is_following": is_following,
        }
