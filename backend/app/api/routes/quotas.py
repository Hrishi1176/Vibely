from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.schemas.user import QuotaStatusResponse
from app.api.dependencies import get_current_user, get_quota_service
from app.services.quota_service import QuotaService

router = APIRouter(prefix="/quotas", tags=["User Quotas"])

@router.get("/status", response_model=QuotaStatusResponse)
def get_status(
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user),
    quota_service: QuotaService = Depends(get_quota_service)
):
    return quota_service.get_quota_status(db, current_user.id)
