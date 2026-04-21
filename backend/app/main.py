from fastapi import FastAPI
from app.api.endpoints import router as api_router
from app.api.whatsapp import router as whatsapp_router
from app.api.analytics import router as analytics_router
from app.db.models import Base
from app.db.session import engine
import os
from app.core.config import settings

# Create database tables
Base.metadata.create_all(bind=engine)

# Create storage directories
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.VECTOR_STORE_DIR, exist_ok=True)

app = FastAPI(title=settings.PROJECT_NAME)

app.include_router(api_router, prefix="/api")
app.include_router(whatsapp_router, prefix="/api/whatsapp", tags=["whatsapp"])
app.include_router(analytics_router, prefix="/api/analytics", tags=["analytics"])

@app.get("/")
def read_root():
    return {"message": "Welcome to the WhatsApp RAG Bot API"}
