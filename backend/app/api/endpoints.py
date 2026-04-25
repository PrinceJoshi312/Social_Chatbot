from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
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
from pydantic import BaseModel, EmailStr, HttpUrl
from typing import Dict, Any, List, Optional
import shutil
import os
import httpx
from bs4 import BeautifulSoup
from langchain.docstore.document import Document as LangDocument
import stripe

router = APIRouter()
doc_processor = DocumentProcessor()
vector_manager = VectorStoreManager()
llm_service = LLMService()

# In a real app, these would be in .env
stripe.api_key = "sk_test_mock_key" 

class BusinessCreateWithEmail(BaseModel):
    owner_email: EmailStr
    plan_id: int

class SubscribeRequest(BaseModel):
    plan_id: int
    bot_name: str

class CrawlRequest(BaseModel):
    url: HttpUrl
    business_id: int

@router.post("/create-checkout-session/")
async def create_checkout_session(plan_id: int, user: models.User = Depends(get_current_user)):
    # This is a mock/infrastructure placeholder for Stripe
    # In production, you'd use: stripe.checkout.Session.create(...)
    return {
        "url": f"https://checkout.stripe.com/pay/mock_session_{plan_id}",
        "success": True
    }

@router.post("/crawl/")
async def crawl_website(request: CrawlRequest, db: Session = Depends(session.get_db), user: models.User = Depends(get_current_user)):
    biz = db.query(models.Business).filter(models.Business.id == request.business_id, models.Business.owner_id == user.id).first()
    if not biz and user.email != "princejoshij736@gmail.com":
        raise HTTPException(status_code=403, detail="Unauthorized")
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(str(request.url), timeout=30.0)
            if response.status_code != 200:
                raise HTTPException(status_code=400, detail="Could not reach the website")
            soup = BeautifulSoup(response.text, 'html.parser')
            for script in soup(["script", "style"]):
                script.decompose()
            text = soup.get_text(separator='\n')
            lines = (line.strip() for line in text.splitlines())
            chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
            clean_text = '\n'.join(chunk for chunk in chunks if chunk)
            doc = LangDocument(page_content=clean_text, metadata={"source": str(request.url)})
            from langchain.text_splitters import RecursiveCharacterTextSplitter
            text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
            split_docs = text_splitter.split_documents([doc])
            vector_manager.add_documents(biz.id, split_docs)
            db_doc = models.Document(filename=f"Crawl: {str(request.url)[:30]}...", file_path=str(request.url), business_id=biz.id, uploader_id=user.id)
            db.add(db_doc)
            db.commit()
            return {"message": "Website crawled and indexed successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Crawl error: {str(e)}")

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
    answer, tool_metadata = await llm_service.generate_response(system_prompt, context, request.query, tool_registry)
    track_query(db, request.business_id, request.query, answer, context)
    return schemas.QueryResponse(query=request.query, context=context, answer=answer)
