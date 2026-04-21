from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from app.db import models, session
from app.schemas import models as schemas
from app.rag.processor import DocumentProcessor
from app.rag.vector_store import VectorStoreManager
from app.rag.llm import LLMService
from app.rag.tools import ToolRegistry
from app.core.telemetry import track_query, track_tool_call
from app.core.config import settings
import shutil
import os

router = APIRouter()
doc_processor = DocumentProcessor()
vector_manager = VectorStoreManager()
llm_service = LLMService()

@router.post("/businesses/", response_model=schemas.Business)
def create_business(business: schemas.BusinessCreate, db: Session = Depends(session.get_db)):
    db_business = models.Business(name=business.name, config=business.config)
    db.add(db_business)
    db.commit()
    db.refresh(db_business)
    return db_business

@router.get("/businesses/", response_model=list[schemas.Business])
def list_businesses(db: Session = Depends(session.get_db)):
    return db.query(models.Business).all()

@router.patch("/businesses/{business_id}", response_model=schemas.Business)
def update_business(business_id: int, updates: schemas.BusinessBase, db: Session = Depends(session.get_db)):
    db_business = db.query(models.Business).filter(models.Business.id == business_id).first()
    if not db_business:
        raise HTTPException(status_code=404, detail="Business not found")
    
    db_business.name = updates.name
    db_business.config = updates.config
    db.commit()
    db.refresh(db_business)
    return db_business

@router.get("/documents/", response_model=list[schemas.Document])
def list_documents(business_id: int, db: Session = Depends(session.get_db)):
    return db.query(models.Document).filter(models.Document.business_id == business_id).all()

@router.post("/upload/")
async def upload_document(
    business_id: int, 
    file: UploadFile = File(...), 
    db: Session = Depends(session.get_db)
):
    # Verify business exists
    business = db.query(models.Business).filter(models.Business.id == business_id).first()
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")

    # Save file locally
    upload_path = os.path.join(settings.UPLOAD_DIR, str(business_id))
    os.makedirs(upload_path, exist_ok=True)
    file_path = os.path.join(upload_path, file.filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Process and Embed
    try:
        chunks = doc_processor.process_file(file_path)
        vector_manager.add_documents(business_id, chunks)
        
        # Save to DB
        db_doc = models.Document(
            filename=file.filename,
            file_path=file_path,
            business_id=business_id
        )
        db.add(db_doc)
        db.commit()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing document: {str(e)}")

    return {"message": "File uploaded and indexed successfully", "filename": file.filename}

@router.post("/query/", response_model=schemas.QueryResponse)
async def query_rag(request: schemas.QueryRequest, db: Session = Depends(session.get_db)):
    # Verify business exists
    business_id = request.business_id
    business = db.query(models.Business).filter(models.Business.id == business_id).first()
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")

    # Search Vector Store
    results = vector_manager.search(business_id, request.query)
    context = [doc.page_content for doc in results]

    # Initialize Tool Registry
    tool_registry = ToolRegistry(db, business_id)

    # Generate response using LLM
    system_prompt = business.config.get("system_prompt", "You are a helpful assistant.")
    answer, tool_metadata = await llm_service.generate_response(system_prompt, context, request.query, tool_registry)

    # Telemetry
    track_query(db, business_id, request.query, answer, context)
    if tool_metadata:
        track_tool_call(db, business_id, tool_metadata["tool"], tool_metadata["args"], tool_metadata["result"])

    return schemas.QueryResponse(
        query=request.query,
        context=context,
        answer=answer
    )
