"""
Database Migration Script (Production & Local Compatible)
Supports SQLite and PostgreSQL/Supabase via SQLAlchemy.
"""
from sqlalchemy import inspect, text
from app.core.database import engine, Base
import logging

logger = logging.getLogger("uvicorn")

def run_migrations():
    logger.info("Running database migrations...")
    
    # 1. Ensure all base tables exist
    Base.metadata.create_all(bind=engine)

    # 2. Inspect existing columns and add missing columns dynamically
    try:
        inspector = inspect(engine)
        if "users" in inspector.get_table_names():
            user_cols = [col["name"] for col in inspector.get_columns("users")]
            
            with engine.begin() as conn:
                if "is_online" not in user_cols:
                    conn.execute(text("ALTER TABLE users ADD COLUMN is_online BOOLEAN DEFAULT FALSE"))
                    logger.info("Added column: users.is_online")
                    
                if "last_seen" not in user_cols:
                    conn.execute(text("ALTER TABLE users ADD COLUMN last_seen TIMESTAMP"))
                    logger.info("Added column: users.last_seen")
                    
                if "google_id" not in user_cols:
                    conn.execute(text("ALTER TABLE users ADD COLUMN google_id VARCHAR(100)"))
                    logger.info("Added column: users.google_id")
                    
        if "direct_messages" in inspector.get_table_names():
            msg_cols = [col["name"] for col in inspector.get_columns("direct_messages")]
            with engine.begin() as conn:
                if "image_url" not in msg_cols:
                    conn.execute(text("ALTER TABLE direct_messages ADD COLUMN image_url TEXT"))
                    logger.info("Added column: direct_messages.image_url")
                if "is_edited" not in msg_cols:
                    conn.execute(text("ALTER TABLE direct_messages ADD COLUMN is_edited BOOLEAN DEFAULT FALSE"))
                    logger.info("Added column: direct_messages.is_edited")
                if "edited_at" not in msg_cols:
                    conn.execute(text("ALTER TABLE direct_messages ADD COLUMN edited_at TIMESTAMP"))
                    logger.info("Added column: direct_messages.edited_at")
                if "deleted_by_sender" not in msg_cols:
                    conn.execute(text("ALTER TABLE direct_messages ADD COLUMN deleted_by_sender BOOLEAN DEFAULT FALSE"))
                    logger.info("Added column: direct_messages.deleted_by_sender")
                if "deleted_by_receiver" not in msg_cols:
                    conn.execute(text("ALTER TABLE direct_messages ADD COLUMN deleted_by_receiver BOOLEAN DEFAULT FALSE"))
                    logger.info("Added column: direct_messages.deleted_by_receiver")
                    
        logger.info("Migrations completed successfully.")
    except Exception as e:
        logger.error(f"Migration error (safe to ignore if columns exist): {e}")

if __name__ == "__main__":
    run_migrations()
