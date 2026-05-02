from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, JSON, Text, Boolean, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    firebase_uid = Column(String, unique=True, index=True, nullable=True)
    hashed_password = Column(String, nullable=True)
    display_name = Column(String, nullable=True)
    photo_url = Column(String, nullable=True)
    provider = Column(String, default="password")
    role = Column(String, default="business_owner") # super_admin, business_owner
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime, default=datetime.utcnow)

    owned_businesses = relationship("Business", back_populates="owner")

class Plan(Base):
    __tablename__ = "plans"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True) # Starter, Pro, Enterprise
    price = Column(Float) # Monthly price
    max_documents = Column(Integer)
    max_messages = Column(Integer)
    whatsapp_enabled = Column(Boolean, default=True)
    
    subscriptions = relationship("Subscription", back_populates="plan")

class Subscription(Base):
    __tablename__ = "subscriptions"
    id = Column(Integer, primary_key=True, index=True)
    business_id = Column(Integer, ForeignKey("businesses.id"))
    plan_id = Column(Integer, ForeignKey("plans.id"))
    status = Column(String, default="active") # active, cancelled, past_due
    start_date = Column(DateTime, default=datetime.utcnow)
    end_date = Column(DateTime)
    
    business = relationship("Business", back_populates="subscription")
    plan = relationship("Plan", back_populates="subscriptions")

class Business(Base):
    __tablename__ = "businesses"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id"))
    api_key = Column(String, unique=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    config = Column(JSON, default={})
    
    # Crawl Metadata
    last_crawled_at = Column(DateTime, nullable=True)
    last_crawl_status = Column(String, nullable=True) # success, failed, skipped
    crawl_failure_count = Column(Integer, default=0)
    content_hash = Column(String, nullable=True)
    last_content_hash = Column(String, nullable=True)

    # AI Settings
    ai_provider = Column(String, default="gemini") # gemini, ollama
    encrypted_gemini_api_key = Column(String, nullable=True)
    llm_model_override = Column(String, nullable=True) # Override default model per business

    owner = relationship("User", back_populates="owned_businesses")
    subscription = relationship("Subscription", back_populates="business", uselist=False)
    
    documents = relationship("Document", back_populates="business", cascade="all, delete-orphan")
    orders = relationship("Order", back_populates="business", cascade="all, delete-orphan")
    bookings = relationship("Booking", back_populates="business", cascade="all, delete-orphan")
    messages = relationship("Message", back_populates="business", cascade="all, delete-orphan")
    events = relationship("AnalyticsEvent", back_populates="business", cascade="all, delete-orphan")
    crawl_jobs = relationship("CrawlJob", back_populates="business", cascade="all, delete-orphan")

class CrawlJob(Base):
    __tablename__ = "crawl_jobs"
    id = Column(Integer, primary_key=True, index=True)
    business_id = Column(Integer, ForeignKey("businesses.id"))
    status = Column(String, default="pending") # pending, running, success, failed, skipped
    attempts = Column(Integer, default=0)
    max_attempts = Column(Integer, default=3)
    error_message = Column(Text, nullable=True)
    started_at = Column(DateTime, nullable=True)
    finished_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    business = relationship("Business", back_populates="crawl_jobs")

class Document(Base):
    __tablename__ = "documents"
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    business_id = Column(Integer, ForeignKey("businesses.id"))
    uploader_id = Column(Integer, ForeignKey("users.id")) # New: User level ownership
    created_at = Column(DateTime, default=datetime.utcnow)
    metadata_info = Column(JSON, default={})
    
    business = relationship("Business", back_populates="documents")
    uploader = relationship("User")

class Order(Base):
    __tablename__ = "orders"
    id = Column(Integer, primary_key=True, index=True)
    order_number = Column(String, unique=True, index=True, nullable=False)
    customer_name = Column(String, nullable=False)
    status = Column(String, default="pending")
    total = Column(Integer)
    business_id = Column(Integer, ForeignKey("businesses.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    business = relationship("Business", back_populates="orders")

class Booking(Base):
    __tablename__ = "bookings"
    id = Column(Integer, primary_key=True, index=True)
    customer_name = Column(String, nullable=False)
    customer_phone = Column(String)
    booking_time = Column(DateTime, nullable=False)
    service = Column(String)
    status = Column(String, default="pending")
    business_id = Column(Integer, ForeignKey("businesses.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    business = relationship("Business", back_populates="bookings")

class Message(Base):
    __tablename__ = "messages"
    id = Column(Integer, primary_key=True, index=True)
    business_id = Column(Integer, ForeignKey("businesses.id"))
    role = Column(String)
    content = Column(Text)
    context_used = Column(JSON, default=[])
    metadata_info = Column(JSON, default={})
    timestamp = Column(DateTime, default=datetime.utcnow)
    business = relationship("Business", back_populates="messages")

class AnalyticsEvent(Base):
    __tablename__ = "analytics_events"
    id = Column(Integer, primary_key=True, index=True)
    business_id = Column(Integer, ForeignKey("businesses.id"))
    event_type = Column(String)
    event_data = Column(JSON, default={})
    timestamp = Column(DateTime, default=datetime.utcnow)
    business = relationship("Business", back_populates="events")
