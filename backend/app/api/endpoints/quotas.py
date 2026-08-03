from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import User
from app.schemas.schemas import QuotaStatusResponse
from app.api.deps import get_current_user
from app.services.quota_manager import QuotaManager

router = APIRouter(prefix="/quotas", tags=["User Quotas & Limits"])

@router.get("/my-quota", response_model=QuotaStatusResponse)
def get_my_quota(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return QuotaManager.get_quota_status(db, current_user.id)
