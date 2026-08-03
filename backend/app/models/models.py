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


class Post(Base):
    __tablename__ = "posts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    image_url = Column(String(500), nullable=True)
    vibe_tag = Column(String(50), nullable=True, default="#Vibely")
    ai_generated = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    author = relationship("User", back_populates="posts")
    comments = relationship("Comment", back_populates="post", cascade="all, delete-orphan")
    likes = relationship("Like", back_populates="post", cascade="all, delete-orphan")


class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("posts.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    post = relationship("Post", back_populates="comments")
    author = relationship("User", back_populates="comments")


class Like(Base):
    __tablename__ = "likes"

    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("posts.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    __table_args__ = (UniqueConstraint('post_id', 'user_id', name='_post_user_like_uc'),)

    post = relationship("Post", back_populates="likes")
    user = relationship("User", back_populates="likes")


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


class DirectMessage(Base):
    __tablename__ = "direct_messages"

    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    receiver_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=True, default="")
    image_url = Column(Text, nullable=True)
    file_url = Column(Text, nullable=True)
    is_edited = Column(Boolean, default=False)
    edited_at = Column(DateTime, nullable=True)
    deleted_by_sender = Column(Boolean, default=False)
    deleted_by_receiver = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    sender = relationship("User", foreign_keys=[sender_id])
    receiver = relationship("User", foreign_keys=[receiver_id])

