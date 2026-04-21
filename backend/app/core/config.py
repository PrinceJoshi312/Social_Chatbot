import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    PROJECT_NAME: str = "WhatsApp RAG Bot"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./sql_app.db")
    VECTOR_STORE_DIR: str = os.getenv("VECTOR_STORE_DIR", "storage/vectors")
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "storage/uploads")
    
    # Default local embedding model
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"
    CHUNK_STRATEGY: str = os.getenv("CHUNK_STRATEGY", "semantic") # options: 'semantic', 'recursive'
    
    # LLM Settings (Local Ollama)
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    LLM_MODEL: str = os.getenv("LLM_MODEL", "llama3")

    # WhatsApp Settings
    WHATSAPP_TOKEN: str = os.getenv("WHATSAPP_TOKEN", "")
    WHATSAPP_PHONE_ID: str = os.getenv("WHATSAPP_PHONE_ID", "")
    WHATSAPP_VERIFY_TOKEN: str = os.getenv("WHATSAPP_VERIFY_TOKEN", "whatsapp_bot_verify_token")

settings = Settings()
