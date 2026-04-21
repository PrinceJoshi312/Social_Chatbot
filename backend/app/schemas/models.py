from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List, Dict

class BusinessBase(BaseModel):
    name: str
    config: Optional[Dict] = {}

class BusinessCreate(BusinessBase):
    pass

class Business(BusinessBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class DocumentBase(BaseModel):
    filename: str
    business_id: int

class Document(DocumentBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class QueryRequest(BaseModel):
    business_id: int
    query: str

class QueryResponse(BaseModel):
    query: str
    context: List[str]
    answer: str # Placeholder for now
