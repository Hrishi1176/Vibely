import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=True)
    google_id = Column(String(100), unique=True, index=True, nullable=True)
    full_name = Column(String(100), nullable=True)
    bio = Column(Text, nullable=True, default="Vibing on Vibely ✨")
    avatar_url = Column(String(255), nullable=True, default="https://api.dicebear.com/7.x/bottts/svg?seed=vibely")
    vibe_badge = Column(String(50), nullable=False, default="Creator")
    is_online = Column(Boolean, default=False)
    last_seen = Column(DateTime, default=datetime.datetime.utcnow)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    posts = relationship("Post", back_populates="author", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="author", cascade="all, delete-orphan")
    likes = relationship("Like", back_populates="user", cascade="all, delete-orphan")
    quotas = relationship("UserQuota", back_populates="user", cascade="all, delete-orphan")


class Follow(Base):
    __tablename__ = "follows"

    id = Column(Integer, primary_key=True, index=True)
    follower_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    following_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    __table_args__ = (UniqueConstraint('follower_id', 'following_id', name='_follower_following_uc'),)


class UserQuota(Base):
    __tablename__ = "user_quotas"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    date_str = Column(String(10), nullable=False)  # Format YYYY-MM-DD
    ai_generations_count = Column(Integer, default=0)
    posts_count = Column(Integer, default=0)
    images_count = Column(Integer, default=0)

    __table_args__ = (UniqueConstraint('user_id', 'date_str', name='_user_date_quota_uc'),)

    user = relationship("User", back_populates="quotas")
