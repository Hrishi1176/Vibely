from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import User, Post, Follow
from app.schemas.schemas import UserResponse, UserUpdate
from app.api.deps import get_current_user, get_optional_user

router = APIRouter(prefix="/users", tags=["Users & Profiles"])


# ── IMPORTANT: Specific routes MUST come before wildcard /{username} ──────────

@router.put("/me", response_model=UserResponse)
def update_profile(
    user_update: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if user_update.full_name is not None:
        current_user.full_name = user_update.full_name
    if user_update.bio is not None:
        current_user.bio = user_update.bio
    if user_update.avatar_url is not None:
        current_user.avatar_url = user_update.avatar_url
    if user_update.vibe_badge is not None:
        current_user.vibe_badge = user_update.vibe_badge

    db.commit()
    db.refresh(current_user)
    return current_user


@router.get("/search/query")
def search_users(
    q: str = "",
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    if not q.strip():
        users = db.query(User).limit(20).all()
    else:
        query_str = f"%{q.strip().lower()}%"
        users = db.query(User).filter(
            (User.username.ilike(query_str)) | (User.full_name.ilike(query_str))
        ).limit(20).all()

    results = []
    for u in users:
        is_following = False
        if current_user and current_user.id != u.id:
            is_following = db.query(Follow).filter(
                Follow.follower_id == current_user.id,
                Follow.following_id == u.id
            ).first() is not None
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


@router.get("/suggestions/list")
def get_user_suggestions(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    all_users = db.query(User).limit(30).all()
    results = []
    for u in all_users:
        if current_user and u.id == current_user.id:
            continue
        is_following = False
        if current_user:
            is_following = db.query(Follow).filter(
                Follow.follower_id == current_user.id,
                Follow.following_id == u.id
            ).first() is not None
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


@router.post("/{user_id}/follow")
def toggle_follow(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot follow yourself")

    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    existing_follow = db.query(Follow).filter(
        Follow.follower_id == current_user.id,
        Follow.following_id == user_id
    ).first()

    if existing_follow:
        db.delete(existing_follow)
        db.commit()
        return {"following": False, "is_following": False, "message": f"Unfollowed {target_user.username}"}
    else:
        new_follow = Follow(follower_id=current_user.id, following_id=user_id)
        db.add(new_follow)
        db.commit()
        return {"following": True, "is_following": True, "message": f"Following {target_user.username}"}


# ── Wildcard route LAST — must be after all specific /users/* routes ──────────
@router.get("/{username}")
def get_user_profile(
    username: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    user = db.query(User).filter(User.username == username.lower()).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    posts_count     = db.query(Post).filter(Post.user_id == user.id).count()
    followers_count = db.query(Follow).filter(Follow.following_id == user.id).count()
    following_count = db.query(Follow).filter(Follow.follower_id == user.id).count()

    is_following = False
    if current_user and current_user.id != user.id:
        is_following = db.query(Follow).filter(
            Follow.follower_id == current_user.id,
            Follow.following_id == user.id
        ).first() is not None

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
