import datetime
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.models import UserQuota
from app.core.config import settings

class QuotaManager:
    @staticmethod
    def get_today_str() -> str:
        return datetime.date.today().isoformat()

    @classmethod
    def get_or_create_quota(cls, db: Session, user_id: int) -> UserQuota:
        today = cls.get_today_str()
        quota = db.query(UserQuota).filter(
            UserQuota.user_id == user_id,
            UserQuota.date_str == today
        ).first()

        if not quota:
            quota = UserQuota(
                user_id=user_id,
                date_str=today,
                ai_generations_count=0,
                posts_count=0,
                images_count=0
            )
            db.add(quota)
            db.commit()
            db.refresh(quota)
        return quota

    @classmethod
    def check_and_increment_ai(cls, db: Session, user_id: int) -> int:
        quota = cls.get_or_create_quota(db, user_id)
        if quota.ai_generations_count >= settings.MAX_DAILY_AI_GENERATIONS:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Daily Vibe AI quota reached ({settings.MAX_DAILY_AI_GENERATIONS}/{settings.MAX_DAILY_AI_GENERATIONS}). Resets tomorrow!"
            )
        quota.ai_generations_count += 1
        db.commit()
        db.refresh(quota)
        return settings.MAX_DAILY_AI_GENERATIONS - quota.ai_generations_count

    @classmethod
    def check_and_increment_post(cls, db: Session, user_id: int):
        quota = cls.get_or_create_quota(db, user_id)
        if quota.posts_count >= settings.MAX_DAILY_POSTS:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Daily post quota reached ({settings.MAX_DAILY_POSTS}/{settings.MAX_DAILY_POSTS}). Resets tomorrow!"
            )
        quota.posts_count += 1
        db.commit()
        db.refresh(quota)

    @classmethod
    def get_quota_status(cls, db: Session, user_id: int) -> dict:
        quota = cls.get_or_create_quota(db, user_id)
        return {
            "date": quota.date_str,
            "ai_used": quota.ai_generations_count,
            "ai_max": settings.MAX_DAILY_AI_GENERATIONS,
            "ai_remaining": max(0, settings.MAX_DAILY_AI_GENERATIONS - quota.ai_generations_count),
            "posts_used": quota.posts_count,
            "posts_max": settings.MAX_DAILY_POSTS,
            "posts_remaining": max(0, settings.MAX_DAILY_POSTS - quota.posts_count),
            "images_used": quota.images_count,
            "images_max": settings.MAX_DAILY_IMAGES,
            "images_remaining": max(0, settings.MAX_DAILY_IMAGES - quota.images_count),
        }
