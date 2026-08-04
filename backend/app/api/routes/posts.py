from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.schemas.post import PostCreate, PostResponse, CommentCreate, CommentResponse
from app.api.dependencies import get_current_user, get_optional_user, get_post_service, get_quota_service, get_ai_service
from app.services.post_service import PostService
from app.services.quota_service import QuotaService
from app.services.ai_service import AiService
from app.repositories.user_repository import UserRepository

router = APIRouter(prefix="/posts", tags=["Posts & Feed"])

@router.get("/stats")
def get_platform_stats(
    db: Session = Depends(get_db),
    post_service: PostService = Depends(get_post_service)
):
    return post_service.get_platform_stats(db, UserRepository())


@router.get("/trending")
def get_trending_tags(
    limit: int = 8, 
    db: Session = Depends(get_db),
    post_service: PostService = Depends(get_post_service)
):
    return post_service.get_trending_tags(db, limit)


@router.get("", response_model=List[PostResponse])
def list_feed(
    skip: int = 0, 
    limit: int = 20, 
    db: Session = Depends(get_db), 
    current_user: Optional[User] = Depends(get_optional_user),
    post_service: PostService = Depends(get_post_service)
):
    return post_service.list_feed(db, skip, limit, current_user)


@router.post("", response_model=PostResponse, status_code=status.HTTP_201_CREATED)
def create_post(
    post_in: PostCreate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user),
    post_service: PostService = Depends(get_post_service),
    quota_service: QuotaService = Depends(get_quota_service),
    ai_service: AiService = Depends(get_ai_service)
):
    try:
        return post_service.create_post(db, post_in, current_user, quota_service, ai_service)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{post_id}/like")
def toggle_like(
    post_id: int, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user),
    post_service: PostService = Depends(get_post_service)
):
    try:
        return post_service.toggle_like(db, post_id, current_user)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/{post_id}/comments", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
def add_comment(
    post_id: int, 
    comment_in: CommentCreate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user),
    post_service: PostService = Depends(get_post_service)
):
    try:
        return post_service.add_comment(db, post_id, comment_in, current_user)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{post_id}/comments", response_model=List[CommentResponse])
def get_comments(
    post_id: int, 
    db: Session = Depends(get_db),
    post_service: PostService = Depends(get_post_service)
):
    return post_service.get_comments(db, post_id)
