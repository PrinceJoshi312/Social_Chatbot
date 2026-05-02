from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, Dict, Any, List

class UserBase(BaseModel):
    email: EmailStr
    firebase_uid: Optional[str] = None
    display_name: Optional[str] = None
    photo_url: Optional[str] = None
    provider: Optional[str] = "password"

class UserCreate(UserBase):
    password: Optional[str] = None

class User(UserBase):
    id: int
    role: str
    is_active: bool
    created_at: datetime
    last_login: datetime
    class Config:
        from_attributes = True

class BusinessBase(BaseModel):
    name: str
    config: Dict[str, Any]

class BusinessCreate(BusinessBase):
    pass

class Business(BusinessBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True

class Document(BaseModel):
    id: int
    filename: str
    created_at: datetime
    class Config:
        from_attributes = True

class QueryRequest(BaseModel):
    business_id: int
    query: str

class QueryResponse(BaseModel):
    query: str
    context: List[str]
    answer: str
