from typing import Optional, List
import random
import string
import re
from fastapi import APIRouter, Depends, HTTPException, status, Query, Response
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token
from app.models.models import User
from app.schemas.schemas import UserRegister, Token, UserResponse
from app.api.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.get("/generate-username")
def generate_unique_username(
    name: Optional[str] = Query(None),
    count: int = Query(5, ge=1, le=10),
    db: Session = Depends(get_db)
):
    results: List[str] = []
    
    raw_name = (name or "").strip()
    words = [re.sub(r'[^a-zA-Z0-9]', '', w.lower()) for w in raw_name.split() if w]
    words = [w for w in words if w]
    
    if words:
        first = words[0]
        last = words[-1] if len(words) > 1 else ""
        
        patterns = []
        if last:
            patterns.extend([
                f"{first}.{last}",
                f"{first}_{last}",
                f"{first}{last}.vibe",
                f"real.{first}{last}",
                f"iam.{first}{last}",
                f"the.{first}{last}",
                f"{first}.{last}.vibe",
                f"vibe.{first}{last}",
                f"{first}{last}_official",
                f"{first}.{last[0]}",
                f"{first[0]}.{last}",
                f"its.{first}{last}",
                f"{first}{last}hq",
            ])
        else:
            patterns.extend([
                f"{first}.vibe",
                f"real.{first}",
                f"iam.{first}",
                f"the.{first}",
                f"its.{first}",
                f"{first}_official",
                f"vibe.{first}",
                f"{first}.hq",
                f"thisis.{first}",
                f"official.{first}",
            ])
            
        for p in patterns:
            p_clean = p.lower()
            if p_clean not in results:
                existing = db.query(User).filter(User.username == p_clean).first()
                if not existing:
                    results.append(p_clean)
                    if len(results) >= count:
                        break
                        
        if len(results) < count:
            base_name = f"{first}{last}" if last else first
            suffix_formats = [
                f"{base_name}{random.randint(1, 99)}",
                f"{first}.{last or 'vibe'}{random.randint(1, 99)}",
                f"{base_name}.vibe{random.randint(1, 9)}",
                f"iam.{base_name}{random.randint(1, 99)}",
                f"the.{base_name}{random.randint(1, 99)}"
            ]
            for s in suffix_formats:
                s_clean = s.lower()
                if s_clean not in results:
                    existing = db.query(User).filter(User.username == s_clean).first()
                    if not existing:
                        results.append(s_clean)
                        if len(results) >= count:
                            break
    
    if len(results) < count:
        prefixes = ["vibe", "real", "iam", "the", "its", "astro", "nova"]
        suffixes = ["creator", "vibe", "hq", "official", "studio", "zone"]
        
        while len(results) < count:
            p = random.choice(prefixes)
            s = random.choice(suffixes)
            num = random.randint(10, 99)
            candidate = f"{p}.{s}{num}"
            if candidate not in results:
                existing = db.query(User).filter(User.username == candidate).first()
                if not existing:
                    results.append(candidate)

    return {
        "username": results[0],
        "usernames": results
    }

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_in: UserRegister, response: Response, db: Session = Depends(get_db)):
    db_user_email = db.query(User).filter(User.email == user_in.email).first()
    if db_user_email:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    db_user_uname = db.query(User).filter(User.username == user_in.username).first()
    if db_user_uname:
        raise HTTPException(status_code=400, detail="Username already taken")
    
    new_user = User(
        username=user_in.username.lower(),
        email=user_in.email.lower(),
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name or user_in.username,
        avatar_url=f"https://api.dicebear.com/7.x/bottts/svg?seed={user_in.username}"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Set HttpOnly Cookie for automatic login on registration
    access_token = create_access_token(subject=new_user.id)
    response.set_cookie(
        key="vibely_token",
        value=access_token,
        httponly=True,
        samesite="lax",
        secure=False,
        max_age=86400 * 7,
        path="/"
    )
    return new_user

@router.post("/login", response_model=Token)
def login(response: Response, form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == form_data.username.lower()).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(subject=user.id)

    # Set Secure HttpOnly Cookie
    response.set_cookie(
        key="vibely_token",
        value=access_token,
        httponly=True,
        samesite="lax",
        secure=False,
        max_age=86400 * 7,
        path="/"
    )

    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/logout")
def logout(response: Response):
    # Clear HttpOnly Cookie
    response.delete_cookie(
        key="vibely_token",
        path="/",
        httponly=True,
        samesite="lax"
    )
    return {"message": "Logged out successfully"}

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


