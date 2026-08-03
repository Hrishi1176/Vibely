from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.models.models import Post, Like, Comment, User
from app.schemas.schemas import PostCreate, PostResponse, CommentCreate, CommentResponse
from app.api.deps import get_current_user, get_optional_user
from app.services.quota_manager import QuotaManager
from app.services.groq_ai import GroqAIService

router = APIRouter(prefix="/posts", tags=["Posts & Feed"])

@router.get("/stats")
def get_platform_stats(db: Session = Depends(get_db)):
    """Return live platform counters: total users, posts, and AI-generated posts."""
    total_users = db.query(User).count()
    total_posts = db.query(Post).count()
    total_ai_posts = db.query(Post).filter(Post.ai_generated == True).count()
    total_likes = db.query(Like).count()
    return {
        "total_users": total_users,
        "total_posts": total_posts,
        "total_ai_posts": total_ai_posts,
        "total_likes": total_likes,
    }

@router.get("/trending")
def get_trending_tags(limit: int = 8, db: Session = Depends(get_db)):
    """Return the most-used vibe tags with their real post counts."""
    rows = (
        db.query(Post.vibe_tag, func.count(Post.id).label("post_count"))
        .filter(Post.vibe_tag != None, Post.vibe_tag != "")
        .group_by(Post.vibe_tag)
        .order_by(func.count(Post.id).desc())
        .limit(limit)
        .all()
    )
    return [{"tag": row.vibe_tag, "post_count": row.post_count} for row in rows]



@router.get("", response_model=List[PostResponse])
def list_feed(skip: int = 0, limit: int = 20, db: Session = Depends(get_db), current_user: Optional[User] = Depends(get_optional_user)):
    posts = db.query(Post).order_by(Post.created_at.desc()).offset(skip).limit(limit).all()
    
    res = []
    user_id = current_user.id if current_user else None
    
    for p in posts:
        likes_count = db.query(Like).filter(Like.post_id == p.id).count()
        comments_count = db.query(Comment).filter(Comment.post_id == p.id).count()
        is_liked = False
        if user_id:
            is_liked = db.query(Like).filter(Like.post_id == p.id, Like.user_id == user_id).first() is not None
        
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

@router.post("", response_model=PostResponse, status_code=status.HTTP_201_CREATED)
def create_post(post_in: PostCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # 1. Enforce Daily Post Quota
    QuotaManager.check_and_increment_post(db, current_user.id)

    # 2. Automated AI Safety Moderation
    mod_check = GroqAIService.moderate_content(post_in.content)
    if not mod_check["is_safe"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Content flagged by safety filter: {mod_check['reason']}"
        )

    # 3. Save post to database
    new_post = Post(
        user_id=current_user.id,
        content=post_in.content,
        image_url=post_in.image_url,
        vibe_tag=post_in.vibe_tag or "#Vibely",
        ai_generated=post_in.ai_generated or False
    )
    db.add(new_post)
    db.commit()
    db.refresh(new_post)

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

@router.post("/{post_id}/like")
def toggle_like(post_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    existing_like = db.query(Like).filter(Like.post_id == post_id, Like.user_id == current_user.id).first()
    if existing_like:
        db.delete(existing_like)
        db.commit()
        return {"liked": False, "message": "Post unliked"}
    else:
        new_like = Like(post_id=post_id, user_id=current_user.id)
        db.add(new_like)
        db.commit()
        return {"liked": True, "message": "Post liked"}

@router.post("/{post_id}/comments", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
def add_comment(post_id: int, comment_in: CommentCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    new_comment = Comment(
        post_id=post_id,
        user_id=current_user.id,
        content=comment_in.content
    )
    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)
    return new_comment

@router.get("/{post_id}/comments", response_model=List[CommentResponse])
def get_comments(post_id: int, db: Session = Depends(get_db)):
    return db.query(Comment).filter(Comment.post_id == post_id).order_by(Comment.created_at.asc()).all()
