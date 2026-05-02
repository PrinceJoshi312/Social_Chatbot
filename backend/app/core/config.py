import os
from typing import Optional
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    PROJECT_NAME: str = "SocialLink"
    _DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./sql_app.db")
    
    @property
    def DATABASE_URL(self) -> str:
        # Fix for PostgreSQL URLs provided by some platforms (e.g. Railway/Render)
        if self._DATABASE_URL.startswith("postgres://"):
            return self._DATABASE_URL.replace("postgres://", "postgresql://", 1)
        return self._DATABASE_URL

    VECTOR_STORE_DIR: str = os.getenv("VECTOR_STORE_DIR", "storage/vectors")
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "storage/uploads")
    
    # Default local embedding model
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"
    CHUNK_STRATEGY: str = os.getenv("CHUNK_STRATEGY", "semantic") # options: 'semantic', 'recursive'
    
    # AI Provider Settings
    AI_PROVIDER: str = os.getenv("AI_PROVIDER", "gemini") # 'gemini' or 'ollama'
    
    # Gemini Settings
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
    
    # Ollama Settings (Optional/Self-hosted)
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "llama3")

    # Security
    API_KEY_ENCRYPTION_SECRET: str = os.getenv("API_KEY_ENCRYPTION_SECRET", "")

    # WhatsApp Settings
    WHATSAPP_TOKEN: str = os.getenv("WHATSAPP_TOKEN", "")
    WHATSAPP_PHONE_ID: str = os.getenv("WHATSAPP_PHONE_ID", "")
    WHATSAPP_VERIFY_TOKEN: str = os.getenv("WHATSAPP_VERIFY_TOKEN", "whatsapp_bot_verify_token")

    # Razorpay Settings
    RAZORPAY_KEY_ID: str = os.getenv("RAZORPAY_KEY_ID", "rzp_test_your_id")
    RAZORPAY_KEY_SECRET: str = os.getenv("RAZORPAY_KEY_SECRET", "your_secret")
    RAZORPAY_WEBHOOK_SECRET: Optional[str] = os.getenv("RAZORPAY_WEBHOOK_SECRET", None)
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173")
    CRON_SECRET: str = os.getenv("CRON_SECRET", "super_secret_cron_token_123")

    # Crawler & Worker Settings
    CRAWLER_MAX_PAGES: int = int(os.getenv("CRAWLER_MAX_PAGES", "1"))
    CRAWLER_MAX_DEPTH: int = int(os.getenv("CRAWLER_MAX_DEPTH", "1"))
    CRAWLER_TIMEOUT_SECONDS: int = int(os.getenv("CRAWLER_TIMEOUT_SECONDS", "30"))
    CRAWLER_CONCURRENCY: int = int(os.getenv("CRAWLER_CONCURRENCY", "3"))
    CRAWLER_POLL_INTERVAL_SECONDS: int = int(os.getenv("CRAWLER_POLL_INTERVAL_SECONDS", "10"))
    CRAWLER_USER_AGENT: str = os.getenv("CRAWLER_USER_AGENT", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36")

settings = Settings()
