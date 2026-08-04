from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Response
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import get_db
from app.core.security import create_access_token
from app.models.user import User
from app.schemas.user import UserRegister, Token, UserResponse, GoogleAuthRequest
from app.api.dependencies import get_current_user, get_auth_service
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])

def set_auth_cookie(response: Response, access_token: str):
    is_local = settings.DATABASE_URL.startswith("sqlite")
    cookie_samesite = "lax" if is_local else "none"
    cookie_secure = False if is_local else True

    response.set_cookie(
        key="vibely_token",
        value=access_token,
        httponly=True,
        samesite=cookie_samesite,
        secure=cookie_secure,
        max_age=86400 * 7,
        path="/"
    )

@router.get("/generate-username")
def generate_unique_username(
    name: Optional[str] = Query(None),
    count: int = Query(5, ge=1, le=10),
    db: Session = Depends(get_db),
    auth_service: AuthService = Depends(get_auth_service)
):
    return auth_service.generate_unique_username(db, name, count)


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(
    user_in: UserRegister, 
    response: Response, 
    db: Session = Depends(get_db),
    auth_service: AuthService = Depends(get_auth_service)
):
    try:
        new_user = auth_service.register_user(db, user_in)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    access_token = create_access_token(subject=new_user.id)
    set_auth_cookie(response, access_token)
    return new_user


@router.post("/login", response_model=Token)
def login(
    response: Response, 
    form_data: OAuth2PasswordRequestForm = Depends(), 
    db: Session = Depends(get_db),
    auth_service: AuthService = Depends(get_auth_service)
):
    user = auth_service.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username/email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(subject=user.id)
    set_auth_cookie(response, access_token)
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/google", response_model=Token)
def google_auth(
    req: GoogleAuthRequest, 
    response: Response, 
    db: Session = Depends(get_db),
    auth_service: AuthService = Depends(get_auth_service)
):
    try:
        user = auth_service.authenticate_google(db, req)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    access_token = create_access_token(subject=user.id)
    set_auth_cookie(response, access_token)
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/logout")
def logout(response: Response):
    is_local = settings.DATABASE_URL.startswith("sqlite")
    cookie_samesite = "lax" if is_local else "none"
    cookie_secure = False if is_local else True

    response.delete_cookie(
        key="vibely_token",
        path="/",
        httponly=True,
        samesite=cookie_samesite,
        secure=cookie_secure
    )
    return {"message": "Logged out successfully"}


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
