from fastapi import APIRouter, Request, HTTPException, Depends, BackgroundTasks
from fastapi.responses import PlainTextResponse
from app.core.config import settings
from app.core.whatsapp import WhatsAppService
from app.rag.llm import LLMService
from app.rag.vector_store import VectorStoreManager
from app.rag.tools import ToolRegistry
from app.db import session, models
from sqlalchemy.orm import Session
from app.core.telemetry import track_query

router = APIRouter()
whatsapp_service = WhatsAppService()
llm_service = LLMService()
vector_manager = VectorStoreManager()

@router.get("/webhook", response_class=PlainTextResponse)
async def verify_webhook(request: Request, db: Session = Depends(session.get_db)):
    params = request.query_params
    
    # Meta sends hub.mode, hub.verify_token, hub.challenge
    # Some environments/proxies might replace dots with underscores
    mode = params.get("hub.mode") or params.get("hub_mode")
    token = params.get("hub.verify_token") or params.get("hub_verify_token")
    challenge = params.get("hub.challenge") or params.get("hub_challenge")

    if mode == "subscribe":
        # 1. Check if any business has this verify token in DB
        businesses = db.query(models.Business).all()
        for b in businesses:
            if b.config.get("whatsapp_verify_token") == token:
                return challenge
        
        # 2. Fallback to .env token
        if token == settings.WHATSAPP_VERIFY_TOKEN:
            return challenge
    
    # If we reach here, verification failed
    raise HTTPException(status_code=403, detail="Verification failed")

@router.post("/webhook")
async def receive_message(request: Request, background_tasks: BackgroundTasks):
    data = await request.json()
    print(f"Incoming WhatsApp Request: {data}") # Requirement 7
    
    try:
        entry = data.get("entry", [])[0]
        changes = entry.get("changes", [])[0]
        value = changes.get("value", {})
        
        messages = value.get("messages", [])
        if not messages:
            return {"status": "ok"} # Requirement 7: Return ok even if no messages

        message = messages[0]
        from_number = message.get("from")
        text_body = message.get("text", {}).get("body")
        phone_number_id = value.get("metadata", {}).get("phone_number_id")

        if text_body:
            background_tasks.add_task(process_whatsapp_rag, from_number, text_body, phone_number_id)

        return {"status": "ok"} # Requirement 7
    except Exception as e:
        print(f"Error parsing WhatsApp webhook: {e}")
        return {"status": "ok"} # Return ok to Meta to avoid retries on parsing errors

async def process_whatsapp_rag(from_number: str, text: str, phone_number_id: str):
    db = next(session.get_db())
    
    # Identify business by Phone ID saved in their config
    business = None
    all_businesses = db.query(models.Business).all()
    for b in all_businesses:
        if b.config.get("whatsapp_phone_id") == phone_number_id:
            business = b
            break
    
    # Fallback to first business if no match (for testing)
    if not business:
        business = db.query(models.Business).first()
    
    if not business:
        print("No business found.")
        return

    # Extract dynamic settings
    biz_token = business.config.get("whatsapp_token")
    biz_phone_id = business.config.get("whatsapp_phone_id")
    system_prompt = business.config.get("system_prompt", "You are a helpful assistant.")

    # 1. Search RAG
    results = vector_manager.search(business.id, text)
    context = [doc.page_content for doc in results]

    # 2. Initialize Tool Registry
    tool_registry = ToolRegistry(db, business.id)

    # 3. Generate Answer
    answer, tool_metadata = await llm_service.generate_response(system_prompt, context, text, tool_registry)

    # 4. Telemetry
    track_query(db, business.id, text, answer, context)

    # 5. Send back via WhatsApp (Using business-specific credentials)
    await whatsapp_service.send_message(from_number, answer, biz_token, biz_phone_id)
    db.close()
