from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from app.api.endpoints import router as api_router
from app.api.whatsapp import router as whatsapp_router
from app.api.analytics import router as analytics_router
from app.api.auth import router as auth_router
from app.api.cron import router as cron_router
from app.db.models import Base
from app.db.session import engine
import firebase_admin_init
import logging
import time

# Configure logging
# logging.basicConfig(level=logging.INFO)
# logger = logging.getLogger("app")

# Tables are managed by Alembic migrations in production (see Procfile)
# Base.metadata.create_all(bind=engine)

app = FastAPI(title="SocialLink API")

@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    print(f"DEBUG_REQUEST: {request.method} {request.url.path} - Status: {response.status_code} - Time: {process_time:.4f}s", flush=True)
    return response

# Add CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, replace with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api/auth", tags=["auth"])
app.include_router(api_router, prefix="/api", tags=["core"])
app.include_router(whatsapp_router, prefix="/api/whatsapp", tags=["whatsapp"])
app.include_router(analytics_router, prefix="/api/analytics", tags=["analytics"])
app.include_router(cron_router)

@app.get("/")
def read_root():
    return {"message": "Welcome to the WhatsApp RAG Bot API"}
