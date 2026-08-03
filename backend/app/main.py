import logging
import sqlite3
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.core.config import settings
from app.core.database import engine, Base, SessionLocal
from app.models.models import User, Post
from app.core.security import get_password_hash
from app.api.endpoints import auth, posts, users, ai, quotas, messages, websocket
from migrate import run_migrations


# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("vibely.main")

# Create all tables (idempotent — skips existing tables)
Base.metadata.create_all(bind=engine)

# ── Safe column migration for SQLite ──────────────────────────────────────────
# Handles the case where a column was added to a model after the DB was created.
# (create_all only creates new tables, never ALTERs existing ones on SQLite.)
def _safe_migrate_sqlite():
    db_url = settings.DATABASE_URL
    if not db_url.startswith("sqlite"):
        return  # Postgres/Supabase: use Alembic instead

    db_path = db_url.replace("sqlite:///", "").replace("./", "")
    try:
        con = sqlite3.connect(db_path)
        cur = con.cursor()

        cur.execute("PRAGMA table_info(users)")
        cols = {row[1] for row in cur.fetchall()}

        migrations = []
        if "is_online" not in cols:
            cur.execute("ALTER TABLE users ADD COLUMN is_online BOOLEAN DEFAULT 0")
            migrations.append("users.is_online")

        if "last_seen" not in cols:
            cur.execute("ALTER TABLE users ADD COLUMN last_seen DATETIME")
            from datetime import datetime
            cur.execute(
                "UPDATE users SET last_seen = ? WHERE last_seen IS NULL",
                (datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),)
            )
            migrations.append("users.last_seen")

        if "image_url" not in cols:
            cur.execute("PRAGMA table_info(direct_messages)")
            msg_cols = {row[1] for row in cur.fetchall()}
            if "image_url" not in msg_cols:
                cur.execute("ALTER TABLE direct_messages ADD COLUMN image_url TEXT")
                migrations.append("direct_messages.image_url")
            if "is_edited" not in msg_cols:
                cur.execute("ALTER TABLE direct_messages ADD COLUMN is_edited BOOLEAN DEFAULT 0")
                migrations.append("direct_messages.is_edited")
            if "edited_at" not in msg_cols:
                cur.execute("ALTER TABLE direct_messages ADD COLUMN edited_at DATETIME")
                migrations.append("direct_messages.edited_at")
            if "deleted_by_sender" not in msg_cols:
                cur.execute("ALTER TABLE direct_messages ADD COLUMN deleted_by_sender BOOLEAN DEFAULT 0")
                migrations.append("direct_messages.deleted_by_sender")
            if "deleted_by_receiver" not in msg_cols:
                cur.execute("ALTER TABLE direct_messages ADD COLUMN deleted_by_receiver BOOLEAN DEFAULT 0")
                migrations.append("direct_messages.deleted_by_receiver")

        if migrations:
            con.commit()
            logger.info("Auto-migrated columns: %s", ", ".join(migrations))
        else:
            logger.info("Schema up-to-date — no migrations needed.")

        con.close()
    except Exception as exc:
        logger.warning("Safe migration skipped: %s", exc)

_safe_migrate_sqlite()



# Custom client IP resolver for rate limiting behind reverse proxies (like Railway/Vercel)
def get_client_ip(request) -> str:
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip.strip()
    return request.client.host if request.client else "127.0.0.1"

# Rate Limiter
limiter = Limiter(key_func=get_client_ip, default_limits=["120/minute"])

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs"
)

uploads_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
os.makedirs(os.path.join(uploads_path, "messages"), exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_path), name="uploads")

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS configuration for Web App & Mobile PWA with credentials support
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8000",
]

# Allow custom production domains from environment variable
import os
allowed_origins_env = os.getenv("ALLOWED_ORIGINS")
if allowed_origins_env:
    for o in allowed_origins_env.split(","):
        clean_origin = o.strip()
        if clean_origin:
            origins.append(clean_origin)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https://.*\.vercel\.app|https://.*\.railway\.app|https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Register Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(posts.router, prefix=settings.API_V1_STR)
app.include_router(users.router, prefix=settings.API_V1_STR)
app.include_router(ai.router, prefix=settings.API_V1_STR)
app.include_router(quotas.router, prefix=settings.API_V1_STR)
app.include_router(messages.router, prefix=settings.API_V1_STR)
app.include_router(websocket.router, prefix=settings.API_V1_STR)

@app.on_event("startup")
def seed_demo_data():
    db = SessionLocal()
    try:
        user_count = db.query(User).count()
        if user_count == 0:
            logger.info("Seeding initial demo users and posts for Vibely...")
            # Demo User 1: Vibely Team
            demo_user1 = User(
                username="vibely",
                email="hello@vibely.ai",
                hashed_password=get_password_hash("vibely123"),
                full_name="Vibely Platform",
                bio=settings.DEFAULT_BIO,
                avatar_url="https://api.dicebear.com/7.x/bottts/svg?seed=vibely",
                vibe_badge="Official"
            )
            # Demo User 2: Alex Rivera
            demo_user2 = User(
                username="alex_vibe",
                email="alex@vibely.ai",
                hashed_password=get_password_hash("alex123"),
                full_name="Alex Rivera",
                bio="AI Tech Enthusiast & Digital Nomad 🚀",
                avatar_url="https://api.dicebear.com/7.x/bottts/svg?seed=alex",
                vibe_badge="Pioneer"
            )
            db.add_all([demo_user1, demo_user2])
            db.commit()
            db.refresh(demo_user1)
            db.refresh(demo_user2)

            # Sample Posts
            p1 = Post(
                user_id=demo_user1.id,
                content=settings.DEFAULT_WELCOME_POST,
                vibe_tag="#VibelyLaunch",
                ai_generated=True
            )
            p2 = Post(
                user_id=demo_user2.id,
                content="Just generated my first AI post caption on Vibely! Ultra-fast performance powered by Groq Llama 3 models. Loving the clean dark glassmorphic design ⚡",
                vibe_tag="#AITech",
                ai_generated=True
            )
            db.add_all([p1, p2])
            db.commit()
            logger.info("Demo data seeded successfully.")
    except Exception as e:
        logger.error(f"Error seeding demo data: {e}")
    finally:
        db.close()

@app.get("/")
def root():
    return {
        "status": "online",
        "app": settings.PROJECT_NAME,
        "docs": f"{settings.API_V1_STR}/docs",
        "version": settings.VERSION
    }
