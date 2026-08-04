from typing import Optional
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
import jwt
from app.core.config import settings
from app.core.database import get_db
from app.models.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login", auto_error=False)


def get_current_user(
    request: Request,
    db: Session = Depends(get_db),
    header_token: Optional[str] = Depends(oauth2_scheme)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate authentication session",
        headers={"WWW-Authenticate": "Bearer"},
    )

    token = header_token if header_token else request.cookies.get("vibely_token")
    if not token:
        raise credentials_exception

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id_str: str = payload.get("sub")
        if user_id_str is None:
            raise credentials_exception
        user_id = int(user_id_str)
    except Exception:
        raise credentials_exception

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception
    return user


def get_optional_user(
    request: Request,
    db: Session = Depends(get_db),
    header_token: Optional[str] = Depends(oauth2_scheme)
) -> Optional[User]:
    token = header_token if header_token else request.cookies.get("vibely_token")
    if not token:
        return None

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id_str: str = payload.get("sub")
        if user_id_str is None:
            return None
        user_id = int(user_id_str)
    except Exception:
        return None

    return db.query(User).filter(User.id == user_id).first()


# Service Dependencies

def get_user_service():
    from app.services.user_service import UserService
    from app.repositories.user_repository import UserRepository, FollowRepository
    from app.repositories.post_repository import PostRepository
    return UserService(UserRepository(), FollowRepository(), PostRepository())

def get_post_service():
    from app.services.post_service import PostService
    from app.repositories.post_repository import PostRepository, CommentRepository, LikeRepository
    return PostService(PostRepository(), CommentRepository(), LikeRepository())

def get_message_service():
    from app.services.message_service import MessageService
    from app.repositories.message_repository import MessageRepository
    from app.repositories.user_repository import UserRepository, FollowRepository
    return MessageService(MessageRepository(), UserRepository(), FollowRepository())

def get_auth_service():
    from app.services.auth_service import AuthService
    from app.repositories.user_repository import UserRepository
    return AuthService(UserRepository())

def get_ai_service():
    from app.services.ai_service import AiService
    return AiService()

def get_quota_service():
    from app.services.quota_service import QuotaService
    from app.repositories.user_repository import UserQuotaRepository
    return QuotaService(UserQuotaRepository())

def get_websocket_service():
    from app.services.websocket_service import websocket_service_instance
    return websocket_service_instance
