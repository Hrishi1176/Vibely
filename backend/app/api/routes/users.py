from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.schemas.user import UserResponse, UserUpdate
from app.api.dependencies import get_current_user, get_optional_user, get_user_service
from app.services.user_service import UserService

router = APIRouter(prefix="/users", tags=["Users & Profiles"])

@router.put("/me", response_model=UserResponse)
def update_profile(
    user_update: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    user_service: UserService = Depends(get_user_service)
):
    return user_service.update_profile(db, current_user, user_update)


@router.get("/search/query")
def search_users(
    q: str = "",
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
    user_service: UserService = Depends(get_user_service)
):
    return user_service.search_users(db, q, current_user)


@router.get("/suggestions/list")
def get_user_suggestions(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
    user_service: UserService = Depends(get_user_service)
):
    return user_service.get_user_suggestions(db, current_user)


@router.post("/{user_id}/follow")
def toggle_follow(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    user_service: UserService = Depends(get_user_service)
):
    try:
        return user_service.toggle_follow(db, current_user, user_id)
    except ValueError as e:
        if str(e) == "User not found":
            raise HTTPException(status_code=404, detail=str(e))
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{username}")
def get_user_profile(
    username: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
    user_service: UserService = Depends(get_user_service)
):
    profile = user_service.get_user_profile(db, username, current_user)
    if not profile:
        raise HTTPException(status_code=404, detail="User not found")
    return profile
