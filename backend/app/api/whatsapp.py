from fastapi import APIRouter, Request, HTTPException, Depends, BackgroundTasks
from app.core.config import settings
from app.core.whatsapp import WhatsAppService
from app.rag.llm import LLMService
from app.rag.vector_store import VectorStoreManager
from app.rag.tools import ToolRegistry
from app.db import session, models
from sqlalchemy.orm import Session

router = APIRouter()
whatsapp_service = WhatsAppService()
llm_service = LLMService()
vector_manager = VectorStoreManager()

@router.get("/webhook")
async def verify_webhook(request: Request):
    params = request.query_params
    mode = params.get("hub.mode")
    token = params.get("hub.verify_token")
    challenge = params.get("hub.challenge")

    if mode == "subscribe" and token == settings.WHATSAPP_VERIFY_TOKEN:
        return int(challenge)
    
    raise HTTPException(status_code=403, detail="Verification failed")

@router.post("/webhook")
async def receive_message(request: Request, background_tasks: BackgroundTasks):
    data = await request.json()
    
    # Extract message info
    try:
        entry = data.get("entry", [])[0]
        changes = entry.get("changes", [])[0]
        value = changes.get("value", {})
        messages = value.get("messages", [])
        
        if not messages:
            return {"status": "no messages"}

        message = messages[0]
        from_number = message.get("from")
        text_body = message.get("text", {}).get("body")

        if text_body:
            # Run RAG and send response in background to avoid Meta timeouts
            background_tasks.add_task(process_whatsapp_rag, from_number, text_body)

        return {"status": "success"}
    except Exception as e:
        print(f"Error parsing WhatsApp webhook: {e}")
        return {"status": "error"}

async def process_whatsapp_rag(from_number: str, text: str):
    db = next(session.get_db())
    business = db.query(models.Business).first()
    
    if not business:
        print("No business configured for WhatsApp.")
        return

    # 1. Search RAG
    results = vector_manager.search(business.id, text)
    context = [doc.page_content for doc in results]

    # 2. Initialize Tool Registry
    tool_registry = ToolRegistry(db, business.id)

    # 3. Generate LLM Answer (with Tool support)
    system_prompt = business.config.get("system_prompt", "You are a helpful assistant.")
    answer = await llm_service.generate_response(system_prompt, context, text, tool_registry)

    # 4. Send back via WhatsApp
    await whatsapp_service.send_message(from_number, answer)
