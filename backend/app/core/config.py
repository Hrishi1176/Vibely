import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Vibely AI Social Platform"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Security
    SECRET_KEY: str = "vibely_super_secret_jwt_key_2026_change_in_production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    GOOGLE_CLIENT_ID: str = ""
    
    # Database (Default to SQLite local, easily swapped to Supabase Postgres)
    DATABASE_URL: str = "sqlite:///./vibely.db"
    
    # AI Engine (Groq Free Tier)
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "llama3-8b-8192"
    
    # Default welcome/greeting text (can be customized from .env)
    DEFAULT_BIO: str = "Welcome to Vibely! Share your world, connect your vibe ✨"
    DEFAULT_WELCOME_POST: str = "🎉 Welcome to Vibely! An AI-powered, 100% free social network designed for creators. Generate smart post captions, chat with VibeAI, and connect with your tribe!"
    AI_FALLBACK_TEMPLATE: str = "VibeAI Assistant: Thanks for your message! '{message}' sounds super interesting. Add GROQ_API_KEY to your environment or .env file to unlock full live Llama 3 responses!"
    
    # Daily User Restrictions for Scalability (100% Free Tier Limits)
    MAX_DAILY_AI_GENERATIONS: int = 10
    MAX_DAILY_POSTS: int = 15
    MAX_DAILY_IMAGES: int = 10

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True

settings = Settings()
