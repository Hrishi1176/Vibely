from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.user import User
from app.models.post import Post, Comment, Like
from app.schemas.post import PostCreate, CommentCreate
from app.repositories.post_repository import PostRepository, CommentRepository, LikeRepository
from app.services.quota_service import QuotaService
from app.services.ai_service import AiService

class PostService:
    def __init__(self, post_repo: PostRepository, comment_repo: CommentRepository, like_repo: LikeRepository):
        self.post_repo = post_repo
        self.comment_repo = comment_repo
        self.like_repo = like_repo

    def get_platform_stats(self, db: Session, user_repo) -> Dict[str, int]:
        total_users = db.query(user_repo.model).count()
        total_posts = db.query(self.post_repo.model).count()
        total_ai_posts = db.query(self.post_repo.model).filter(self.post_repo.model.ai_generated == True).count()
        total_likes = db.query(self.like_repo.model).count()
        return {
            "total_users": total_users,
            "total_posts": total_posts,
            "total_ai_posts": total_ai_posts,
            "total_likes": total_likes,
        }

    def get_trending_tags(self, db: Session, limit: int = 8) -> List[Dict[str, Any]]:
        rows = (
            db.query(self.post_repo.model.vibe_tag, func.count(self.post_repo.model.id).label("post_count"))
            .filter(self.post_repo.model.vibe_tag != None, self.post_repo.model.vibe_tag != "")
            .group_by(self.post_repo.model.vibe_tag)
            .order_by(func.count(self.post_repo.model.id).desc())
            .limit(limit)
            .all()
        )
        return [{"tag": row.vibe_tag, "post_count": row.post_count} for row in rows]

    def list_feed(self, db: Session, skip: int = 0, limit: int = 20, current_user: Optional[User] = None) -> List[Dict[str, Any]]:
        posts = db.query(self.post_repo.model).order_by(self.post_repo.model.created_at.desc()).offset(skip).limit(limit).all()
        
        res = []
        user_id = current_user.id if current_user else None
        
        for p in posts:
            likes_count = db.query(self.like_repo.model).filter(self.like_repo.model.post_id == p.id).count()
            comments_count = db.query(self.comment_repo.model).filter(self.comment_repo.model.post_id == p.id).count()
            is_liked = False
            if user_id:
                is_liked = self.like_repo.get_like(db, p.id, user_id) is not None
            
            post_dict = {
                "id": p.id,
                "user_id": p.user_id,
                "content": p.content,
                "image_url": p.image_url,
                "vibe_tag": p.vibe_tag,
                "ai_generated": p.ai_generated,
                "created_at": p.created_at,
                "author": p.author,
                "likes_count": likes_count,
                "comments_count": comments_count,
                "is_liked_by_me": is_liked
            }
            res.append(post_dict)
        return res

    def create_post(self, db: Session, post_in: PostCreate, current_user: User, quota_service: QuotaService, ai_service: AiService) -> Dict[str, Any]:
        quota_service.check_and_increment_post(db, current_user.id)

        mod_check = ai_service.moderate_content(post_in.content)
        if not mod_check["is_safe"]:
            raise ValueError(f"Content flagged by safety filter: {mod_check['reason']}")

        new_post = self.post_repo.create(db, obj_in={
            "user_id": current_user.id,
            "content": post_in.content,
            "image_url": post_in.image_url,
            "vibe_tag": post_in.vibe_tag or "#Vibely",
            "ai_generated": post_in.ai_generated or False
        })

        return {
            "id": new_post.id,
            "user_id": new_post.user_id,
            "content": new_post.content,
            "image_url": new_post.image_url,
            "vibe_tag": new_post.vibe_tag,
            "ai_generated": new_post.ai_generated,
            "created_at": new_post.created_at,
            "author": current_user,
            "likes_count": 0,
            "comments_count": 0,
            "is_liked_by_me": False
        }

    def toggle_like(self, db: Session, post_id: int, current_user: User) -> Dict[str, Any]:
        post = self.post_repo.get(db, post_id)
        if not post:
            raise ValueError("Post not found")
        
        existing_like = self.like_repo.get_like(db, post_id, current_user.id)
        if existing_like:
            self.like_repo.delete(db, id=existing_like.id)
            return {"liked": False, "message": "Post unliked"}
        else:
            self.like_repo.create(db, obj_in={"post_id": post_id, "user_id": current_user.id})
            return {"liked": True, "message": "Post liked"}

    def add_comment(self, db: Session, post_id: int, comment_in: CommentCreate, current_user: User) -> Comment:
        post = self.post_repo.get(db, post_id)
        if not post:
            raise ValueError("Post not found")
        
        return self.comment_repo.create(db, obj_in={
            "post_id": post_id,
            "user_id": current_user.id,
            "content": comment_in.content
        })

    def get_comments(self, db: Session, post_id: int) -> List[Comment]:
        return db.query(self.comment_repo.model).filter(self.comment_repo.model.post_id == post_id).order_by(self.comment_repo.model.created_at.asc()).all()
