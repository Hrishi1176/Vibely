from typing import Optional, List, Dict, Any
import random
import re
import requests
from sqlalchemy.orm import Session
from app.models.user import User
from app.schemas.user import UserRegister, GoogleAuthRequest
from app.repositories.user_repository import UserRepository
from app.core.security import verify_password, get_password_hash

class AuthService:
    def __init__(self, user_repo: UserRepository):
        self.user_repo = user_repo

    def generate_unique_username(self, db: Session, name: Optional[str] = None, count: int = 5) -> Dict[str, Any]:
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
                    f"{first}.{last}", f"{first}_{last}", f"{first}{last}.vibe", f"real.{first}{last}",
                    f"iam.{first}{last}", f"the.{first}{last}", f"{first}.{last}.vibe", f"vibe.{first}{last}",
                    f"{first}{last}_official", f"{first}.{last[0]}", f"{first[0]}.{last}", f"its.{first}{last}", f"{first}{last}hq",
                ])
            else:
                patterns.extend([
                    f"{first}.vibe", f"real.{first}", f"iam.{first}", f"the.{first}", f"its.{first}",
                    f"{first}_official", f"vibe.{first}", f"{first}.hq", f"thisis.{first}", f"official.{first}",
                ])
                
            for p in patterns:
                p_clean = p.lower()
                if p_clean not in results:
                    existing = self.user_repo.get_by_username(db, p_clean)
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
                        existing = self.user_repo.get_by_username(db, s_clean)
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
                    existing = self.user_repo.get_by_username(db, candidate)
                    if not existing:
                        results.append(candidate)

        return {
            "username": results[0] if results else "vibe",
            "usernames": results
        }

    def register_user(self, db: Session, user_in: UserRegister) -> User:
        if self.user_repo.get_by_email(db, user_in.email):
            raise ValueError("Email already registered")
        if self.user_repo.get_by_username(db, user_in.username):
            raise ValueError("Username already taken")

        return self.user_repo.create(db, obj_in={
            "username": user_in.username.lower(),
            "email": user_in.email.lower(),
            "hashed_password": get_password_hash(user_in.password),
            "full_name": user_in.full_name or user_in.username,
            "avatar_url": f"https://api.dicebear.com/7.x/bottts/svg?seed={user_in.username}"
        })

    def authenticate_user(self, db: Session, identifier: str, password: str) -> Optional[User]:
        identifier = identifier.lower().strip()
        user = self.user_repo.get_by_username(db, identifier)
        if not user:
            user = self.user_repo.get_by_email(db, identifier)
        if not user or not user.hashed_password or not verify_password(password, user.hashed_password):
            return None
        return user

    def authenticate_google(self, db: Session, req: GoogleAuthRequest) -> User:
        google_email = None
        google_sub = None
        full_name = req.full_name or ""
        avatar_url = req.avatar_url

        token = req.id_token or req.credential
        if token:
            try:
                google_res = requests.get(f"https://oauth2.googleapis.com/tokeninfo?id_token={token}", timeout=5)
                if google_res.status_code == 200:
                    data = google_res.json()
                    google_email = data.get("email")
                    google_sub = data.get("sub")
                    if not full_name:
                        full_name = data.get("name") or data.get("given_name") or ""
                    if not avatar_url:
                        avatar_url = data.get("picture")
            except Exception as err:
                print("Google token verification warning:", err)
        
        if not google_email and req.email:
            google_email = req.email
        if not google_sub and req.sub:
            google_sub = req.sub
        if not google_sub and google_email:
            google_sub = f"google_{google_email}"

        if not google_email:
            raise ValueError("Could not verify Google authentication token or missing email.")

        google_email = google_email.lower().strip()
        user = self.user_repo.get_by_email(db, google_email)
        if not user:
            user = self.user_repo.get_by_google_id(db, google_sub)

        if not user:
            base_handle = (full_name or google_email.split('@')[0]).strip()
            clean_handle = re.sub(r'[^a-zA-Z0-9]', '', base_handle.lower()) or "vibely"
            
            username_candidate = clean_handle
            counter = 1
            while self.user_repo.get_by_username(db, username_candidate):
                username_candidate = f"{clean_handle}{counter}"
                counter += 1

            new_avatar = avatar_url or f"https://api.dicebear.com/7.x/bottts/svg?seed={username_candidate}"
            user = self.user_repo.create(db, obj_in={
                "username": username_candidate,
                "email": google_email,
                "hashed_password": None,
                "google_id": google_sub,
                "full_name": full_name or username_candidate,
                "avatar_url": new_avatar
            })
        else:
            modified = False
            if not user.google_id:
                user.google_id = google_sub
                modified = True
            if avatar_url and (not user.avatar_url or "dicebear.com" in user.avatar_url or user.avatar_url != avatar_url):
                user.avatar_url = avatar_url
                modified = True
            if full_name and (not user.full_name or user.full_name == user.username):
                user.full_name = full_name
                modified = True
            if modified:
                db.commit()
                db.refresh(user)

        return user
