from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, JSON, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()

class Business(Base):
    __tablename__ = "businesses"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    api_key = Column(String, unique=True, index=True)  # Simple API key for now
    created_at = Column(DateTime, default=datetime.utcnow)
    config = Column(JSON, default={})  # Store business-specific prompts, etc.

    documents = relationship("Document", back_populates="business")

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    business_id = Column(Integer, ForeignKey("businesses.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    metadata_info = Column(JSON, default={})

    business = relationship("Business", back_populates="documents")

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    order_number = Column(String, unique=True, index=True, nullable=False)
    customer_name = Column(String, nullable=False)
    status = Column(String, default="pending") # pending, shipped, delivered, cancelled
    total = Column(Integer) # In cents
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

# Update Business to include bookings
Business.orders = relationship("Order", back_populates="business")
Business.bookings = relationship("Booking", back_populates="business")
Business.messages = relationship("Message", back_populates="business")
Business.events = relationship("AnalyticsEvent", back_populates="business")

class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    business_id = Column(Integer, ForeignKey("businesses.id"))
    role = Column(String) # user, bot, system
    content = Column(Text)
    context_used = Column(JSON, default=[])
    metadata_info = Column(JSON, default={})
    timestamp = Column(DateTime, default=datetime.utcnow)

    business = relationship("Business", back_populates="messages")

class AnalyticsEvent(Base):
    __tablename__ = "analytics_events"

    id = Column(Integer, primary_key=True, index=True)
    business_id = Column(Integer, ForeignKey("businesses.id"))
    event_type = Column(String) # query, tool_call, error, handoff
    event_data = Column(JSON, default={})
    timestamp = Column(DateTime, default=datetime.utcnow)

    business = relationship("Business", back_populates="events")
