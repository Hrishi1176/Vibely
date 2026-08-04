import datetime
from sqlalchemy.orm import Session
from app.models.user import UserQuota
from app.core.config import settings
from app.repositories.user_repository import UserQuotaRepository

class QuotaService:
    def __init__(self, quota_repo: UserQuotaRepository):
        self.quota_repo = quota_repo

    def get_today_str(self) -> str:
        return datetime.date.today().isoformat()

    def get_or_create_quota(self, db: Session, user_id: int) -> UserQuota:
        today = self.get_today_str()
        quota = self.quota_repo.get_quota(db, user_id, today)

        if not quota:
            quota = self.quota_repo.create(db, obj_in={
                "user_id": user_id,
                "date_str": today,
                "ai_generations_count": 0,
                "posts_count": 0,
                "images_count": 0
            })
        return quota

    def check_and_increment_ai(self, db: Session, user_id: int) -> tuple[UserQuota, int]:
        quota = self.get_or_create_quota(db, user_id)
        if quota.ai_generations_count >= settings.MAX_DAILY_AI_GENERATIONS:
            raise ValueError(f"Daily Vibe AI quota reached ({settings.MAX_DAILY_AI_GENERATIONS}/{settings.MAX_DAILY_AI_GENERATIONS}). Resets tomorrow!")
        
        self.quota_repo.update(db, db_obj=quota, obj_in={"ai_generations_count": quota.ai_generations_count + 1})
        remaining = settings.MAX_DAILY_AI_GENERATIONS - quota.ai_generations_count
        return quota, max(0, remaining)

    def check_and_increment_post(self, db: Session, user_id: int) -> tuple[UserQuota, int]:
        quota = self.get_or_create_quota(db, user_id)
        if quota.posts_count >= settings.MAX_DAILY_POSTS:
            raise ValueError(f"Daily post quota reached ({settings.MAX_DAILY_POSTS}/{settings.MAX_DAILY_POSTS}). Resets tomorrow!")
        
        self.quota_repo.update(db, db_obj=quota, obj_in={"posts_count": quota.posts_count + 1})
        remaining = settings.MAX_DAILY_POSTS - quota.posts_count
        return quota, max(0, remaining)

    def check_and_increment_image(self, db: Session, user_id: int) -> tuple[UserQuota, int]:
        quota = self.get_or_create_quota(db, user_id)
        if quota.images_count >= settings.MAX_DAILY_IMAGES:
            raise ValueError(f"Daily image quota reached ({settings.MAX_DAILY_IMAGES}/{settings.MAX_DAILY_IMAGES}). Resets tomorrow!")
        
        self.quota_repo.update(db, db_obj=quota, obj_in={"images_count": quota.images_count + 1})
        remaining = settings.MAX_DAILY_IMAGES - quota.images_count
        return quota, max(0, remaining)

    def get_quota_status(self, db: Session, user_id: int) -> dict:
        quota = self.get_or_create_quota(db, user_id)
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
