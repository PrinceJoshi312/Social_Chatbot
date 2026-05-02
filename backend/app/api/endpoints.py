from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Request
from sqlalchemy.orm import Session
from app.db import models, session
from app.schemas import models as schemas
from app.api.auth import get_current_user
from app.rag.processor import DocumentProcessor
from app.rag.vector_store import VectorStoreManager
from app.rag.llm import LLMService
from app.rag.tools import ToolRegistry
from app.core.telemetry import track_query, track_tool_call
from app.core.config import settings
from app.core.security import secret_manager
from pydantic import BaseModel, EmailStr, HttpUrl
from typing import Dict, Any, List, Optional
import shutil
import os
import re
import httpx
from bs4 import BeautifulSoup
from langchain.docstore.document import Document as LangDocument
import razorpay

router = APIRouter()
doc_processor = DocumentProcessor()
vector_manager = VectorStoreManager()
llm_service = LLMService()

# Razorpay Client
razorpay_client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))

class BusinessCreateWithEmail(BaseModel):
    owner_email: EmailStr
    plan_id: int

class SubscribeRequest(BaseModel):
    plan_id: int
    bot_name: str

class CrawlRequest(BaseModel):
    url: HttpUrl
    business_id: int

class RazorpayVerifyRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    plan_id: int
    bot_name: str

class AISettingsUpdate(BaseModel):
    ai_provider: Optional[str] = None
    gemini_api_key: Optional[str] = None
    llm_model_override: Optional[str] = None

@router.get("/businesses/{business_id}/ai-settings")
def get_ai_settings(business_id: int, db: Session = Depends(session.get_db), user: models.User = Depends(get_current_user)):
    biz = db.query(models.Business).filter(models.Business.id == business_id, models.Business.owner_id == user.id).first()
    if not biz and user.email != "princejoshij736@gmail.com":
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    masked_key = secret_manager.mask_key(secret_manager.decrypt(biz.encrypted_gemini_api_key))
    
    return {
        "ai_provider": biz.ai_provider or settings.AI_PROVIDER,
        "llm_model_override": biz.llm_model_override,
        "has_gemini_api_key": biz.encrypted_gemini_api_key is not None,
        "masked_gemini_api_key": masked_key
    }

@router.patch("/businesses/{business_id}/ai-settings")
async def update_ai_settings(business_id: int, data: AISettingsUpdate, db: Session = Depends(session.get_db), user: models.User = Depends(get_current_user)):
    biz = db.query(models.Business).filter(models.Business.id == business_id, models.Business.owner_id == user.id).first()
    if not biz and user.email != "princejoshij736@gmail.com":
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    if data.ai_provider:
        biz.ai_provider = data.ai_provider
    
    if data.llm_model_override is not None:
        biz.llm_model_override = data.llm_model_override
        
    if data.gemini_api_key:
        if not secret_manager.enabled:
            raise HTTPException(status_code=500, detail="Server encryption is disabled. Cannot store API keys.")
        biz.encrypted_gemini_api_key = secret_manager.encrypt(data.gemini_api_key)
        
    db.commit()
    return {"message": "AI settings updated"}

@router.delete("/businesses/{business_id}/gemini-api-key")
def delete_gemini_key(business_id: int, db: Session = Depends(session.get_db), user: models.User = Depends(get_current_user)):
    biz = db.query(models.Business).filter(models.Business.id == business_id, models.Business.owner_id == user.id).first()
    if not biz and user.email != "princejoshij736@gmail.com":
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    biz.encrypted_gemini_api_key = None
    db.commit()
    return {"message": "API key deleted"}

@router.post("/businesses/{business_id}/test-ai")
async def test_ai_connection(business_id: int, db: Session = Depends(session.get_db), user: models.User = Depends(get_current_user)):
    biz = db.query(models.Business).filter(models.Business.id == business_id, models.Business.owner_id == user.id).first()
    if not biz and user.email != "princejoshij736@gmail.com":
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    # Simple test prompt
    test_prompt = "Hello, this is a test. Respond with 'OK' if you can hear me."
    try:
        answer, _ = await llm_service.generate_response(
            "Respond simply.", [], test_prompt, db=db, business_id=business_id
        )
        if "Error" in answer:
            return {"status": "failed", "message": answer}
        return {"status": "success", "message": f"Connection successful: {answer[:50]}"}
    except Exception as e:
        return {"status": "failed", "message": str(e)}

@router.post("/create-razorpay-order/")
async def create_razorpay_order(plan_id: int, bot_name: str, db: Session = Depends(session.get_db), user: models.User = Depends(get_current_user)):
    plan = db.query(models.Plan).filter(models.Plan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    try:
        # Amount is in paise for Razorpay
        amount = int(plan.price * 100)
        
        data = {
            "amount": amount,
            "currency": "INR", # Adjust currency if needed
            "receipt": f"receipt_{user.id}_{plan_id}",
            "notes": {
                "plan_id": str(plan.id),
                "bot_name": bot_name,
                "user_id": str(user.id)
            }
        }
        
        order = razorpay_client.order.create(data=data)
        return {
            "order_id": order['id'],
            "amount": order['amount'],
            "currency": order['currency'],
            "key": settings.RAZORPAY_KEY_ID,
            "user": {
                "name": user.display_name or "",
                "email": user.email
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/verify-razorpay-payment/")
async def verify_razorpay_payment(data: RazorpayVerifyRequest, db: Session = Depends(session.get_db), user: models.User = Depends(get_current_user)):
    try:
        # 1. Verify Signature
        params_dict = {
            'razorpay_order_id': data.razorpay_order_id,
            'razorpay_payment_id': data.razorpay_payment_id,
            'razorpay_signature': data.razorpay_signature
        }
        
        razorpay_client.utility.verify_payment_signature(params_dict)
        
        # 2. Signature is valid, activate subscription and bot
        biz = db.query(models.Business).filter(models.Business.owner_id == user.id).first()
        if not biz:
            biz = models.Business(name=data.bot_name, owner_id=user.id, config={"system_prompt": "You are a helpful assistant."})
            db.add(biz)
            db.commit()
            db.refresh(biz)
        else:
            biz.name = data.bot_name
            db.commit()

        sub = db.query(models.Subscription).filter(models.Subscription.business_id == biz.id).first()
        if sub:
            sub.plan_id = data.plan_id
            sub.status = "active"
        else:
            sub = models.Subscription(business_id=biz.id, plan_id=data.plan_id, status="active")
            db.add(sub)
        
        db.commit()
        return {"status": "success", "message": "Subscription activated successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Payment verification failed: {str(e)}")

@router.post("/webhook/razorpay")
async def razorpay_webhook(request: Request, db: Session = Depends(session.get_db)):
    if not settings.RAZORPAY_WEBHOOK_SECRET:
        return {"status": "webhook secret not configured"}
        
    payload = await request.body()
    sig_header = request.headers.get("x-razorpay-signature")

    try:
        razorpay_client.utility.verify_webhook_signature(
            payload.decode('utf-8'), sig_header, settings.RAZORPAY_WEBHOOK_SECRET
        )
    except Exception:
        return {"status": "invalid signature"}

    event = await request.json()
    
    if event.get("event") == "order.paid":
        order_obj = event["payload"]["order"]["entity"]
        notes = order_obj.get("notes", {})
        user_id = notes.get("user_id")
        plan_id = notes.get("plan_id")
        bot_name = notes.get("bot_name")

        if user_id and plan_id and bot_name:
            user_id = int(user_id)
            plan_id = int(plan_id)
            
            biz = db.query(models.Business).filter(models.Business.owner_id == user_id).first()
            if not biz:
                biz = models.Business(name=bot_name, owner_id=user_id, config={"system_prompt": "You are a helpful assistant."})
                db.add(biz)
                db.commit()
                db.refresh(biz)
            else:
                biz.name = bot_name
                db.commit()

            sub = db.query(models.Subscription).filter(models.Subscription.business_id == biz.id).first()
            if sub:
                sub.plan_id = plan_id
                sub.status = "active"
            else:
                sub = models.Subscription(business_id=biz.id, plan_id=plan_id, status="active")
                db.add(sub)
            db.commit()

    return {"status": "success"}

from app.core.crawler import crawl_and_index

@router.post("/crawl/")
async def crawl_website(request: CrawlRequest, db: Session = Depends(session.get_db), user: models.User = Depends(get_current_user)):
    biz = db.query(models.Business).filter(models.Business.id == request.business_id, models.Business.owner_id == user.id).first()
    if not biz and user.email != "princejoshij736@gmail.com":
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    status, message = await crawl_and_index(str(request.url), biz.id, user.id, db)
    if status == "failed":
        raise HTTPException(status_code=400, detail=message)
    
    if status == "skipped":
        return {"message": "Knowledge base is already up to date (no changes detected)."}
        
    return {"message": "Success: Content crawled, converted to PDF/Text, and indexed."}

@router.get("/businesses/")
def list_my_businesses(db: Session = Depends(session.get_db), user: models.User = Depends(get_current_user)):
    if user.email == "princejoshij736@gmail.com":
        businesses = db.query(models.Business).all()
    else:
        businesses = db.query(models.Business).filter(models.Business.owner_id == user.id).all()
    results = []
    for b in businesses:
        owner = db.query(models.User).filter(models.User.id == b.owner_id).first()
        sub = db.query(models.Subscription).filter(models.Subscription.business_id == b.id).first()
        results.append({
            "id": b.id, "name": b.name, "owner_email": owner.email if owner else "Unknown",
            "config": b.config, "has_plan": sub is not None,
            "plan_name": db.query(models.Plan.name).filter(models.Plan.id == sub.plan_id).scalar() if sub else "None"
        })
    return results

@router.get("/plans/")
def list_plans(db: Session = Depends(session.get_db)):
    plans = db.query(models.Plan).all()
    return [{"id": p.id, "name": p.name, "price": p.price, "max_documents": p.max_documents, "max_messages": p.max_messages} for p in plans]

@router.post("/subscribe/")
def handle_subscription(data: SubscribeRequest, db: Session = Depends(session.get_db), user: models.User = Depends(get_current_user)):
    biz = db.query(models.Business).filter(models.Business.owner_id == user.id).first()
    if not biz:
        biz = models.Business(name=data.bot_name, owner_id=user.id, config={"system_prompt": "You are a helpful assistant."})
        db.add(biz)
        db.commit()
        db.refresh(biz)
    else:
        biz.name = data.bot_name
        db.commit()
    sub = db.query(models.Subscription).filter(models.Subscription.business_id == biz.id).first()
    if sub: sub.plan_id = data.plan_id
    else:
        sub = models.Subscription(business_id=biz.id, plan_id=data.plan_id, status="active")
        db.add(sub)
    db.commit()
    return {"message": "Success"}

@router.get("/documents/")
def list_documents(business_id: int, db: Session = Depends(session.get_db), user: models.User = Depends(get_current_user)):
    return db.query(models.Document).filter(models.Document.business_id == business_id, models.Document.uploader_id == user.id).all()

@router.post("/upload/")
async def upload_document(business_id: int, file: UploadFile = File(...), db: Session = Depends(session.get_db), user: models.User = Depends(get_current_user)):
    biz = db.query(models.Business).filter(models.Business.id == business_id, models.Business.owner_id == user.id).first()
    if not biz: raise HTTPException(status_code=403, detail="Unauthorized")
    upload_path = os.path.join(settings.UPLOAD_DIR, str(business_id))
    os.makedirs(upload_path, exist_ok=True)
    file_path = os.path.join(upload_path, file.filename)
    with open(file_path, "wb") as buffer: shutil.copyfileobj(file.file, buffer)
    try:
        chunks = doc_processor.process_file(file_path)
        vector_manager.add_documents(business_id, chunks)
        db_doc = models.Document(filename=file.filename, file_path=file_path, business_id=business_id, uploader_id=user.id)
        db.add(db_doc)
        db.commit()
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))
    return {"message": "Uploaded", "filename": file.filename}

@router.delete("/documents/{document_id}")
def delete_document(document_id: int, db: Session = Depends(session.get_db), user: models.User = Depends(get_current_user)):
    doc = db.query(models.Document).filter(models.Document.id == document_id, models.Document.uploader_id == user.id).first()
    if not doc: raise HTTPException(status_code=403, detail="Unauthorized")
    if os.path.exists(doc.file_path) and not doc.file_path.startswith("http"):
        os.remove(doc.file_path)
    db.delete(doc)
    db.commit()
    return {"message": "Deleted"}

@router.delete("/businesses/{business_id}")
def delete_business(business_id: int, db: Session = Depends(session.get_db), user: models.User = Depends(get_current_user)):
    if user.email != "princejoshij736@gmail.com": raise HTTPException(status_code=403)
    db_business = db.query(models.Business).filter(models.Business.id == business_id).first()
    db.delete(db_business)
    db.commit()
    return {"message": "Deleted"}

@router.post("/query/", response_model=schemas.QueryResponse)
async def query_rag(request: schemas.QueryRequest, db: Session = Depends(session.get_db), user: models.User = Depends(get_current_user)):
    biz = db.query(models.Business).filter(models.Business.id == request.business_id, models.Business.owner_id == user.id).first()
    if not biz and user.email != "princejoshij736@gmail.com": raise HTTPException(status_code=403)
    results = vector_manager.search(request.business_id, request.query)
    context = [doc.page_content for doc in results]
    tool_registry = ToolRegistry(db, request.business_id)
    system_prompt = biz.config.get("system_prompt", "You are a helpful assistant.")
    answer, tool_metadata = await llm_service.generate_response(
        system_prompt, 
        context, 
        request.query, 
        db=db, 
        business_id=request.business_id, 
        tool_registry=tool_registry
    )
    track_query(db, request.business_id, request.query, answer, context)
    return schemas.QueryResponse(query=request.query, context=context, answer=answer)
