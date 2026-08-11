from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # App Settings
    ENV: str = "development"
    PROJECT_NAME: str = "Meridian AI"

    # Database
    DATABASE_URL: str = "postgresql://postgres:postgres@db:5432/meridian"

    # Redis
    REDIS_URL: str = "redis://redis:6379/0"

    # Qdrant Vector DB
    QDRANT_URL: str = "http://qdrant:6333"

    # Security & Auth
    JWT_SECRET_KEY: str = "dev_secret_key_change_me_in_production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    # AI API Keys
    OPENAI_API_KEY: Optional[str] = None
    GEMINI_API_KEY: Optional[str] = None

    # Observability
    LANGFUSE_PUBLIC_KEY: Optional[str] = None
    LANGFUSE_SECRET_KEY: Optional[str] = None
    LANGFUSE_HOST: Optional[str] = "https://cloud.langfuse.com"
    SENTRY_DSN: Optional[str] = None

    # Configure Pydantic to read from backend/.env
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"  # Allow extra env variables without failing
    )


settings = Settings()
