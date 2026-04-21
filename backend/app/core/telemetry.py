from sqlalchemy.orm import Session
from app.db.models import Message, AnalyticsEvent
from typing import List, Dict, Any, Optional

class TelemetryService:
    def __init__(self, db: Session, business_id: int):
        self.db = db
        self.business_id = business_id

    def log_message(self, role: str, content: str, context_used: List[str] = [], metadata: Dict[str, Any] = {}):
        msg = Message(
            business_id=self.business_id,
            role=role,
            content=content,
            context_used=context_used,
            metadata_info=metadata
        )
        self.db.add(msg)
        self.db.commit()

    def log_event(self, event_type: str, data: Dict[str, Any] = {}):
        event = AnalyticsEvent(
            business_id=self.business_id,
            event_type=event_type,
            event_data=data
        )
        self.db.add(event)
        self.db.commit()

def track_query(db: Session, business_id: int, query: str, answer: str, context: List[str]):
    telemetry = TelemetryService(db, business_id)
    # Log user message
    telemetry.log_message("user", query)
    # Log bot message
    telemetry.log_message("bot", answer, context_used=context)
    # Log analytics event
    telemetry.log_event("query", {"query": query, "context_count": len(context)})

def track_tool_call(db: Session, business_id: int, tool_name: str, args: str, result: str):
    telemetry = TelemetryService(db, business_id)
    telemetry.log_event("tool_call", {
        "tool": tool_name,
        "args": args,
        "result": result
    })
