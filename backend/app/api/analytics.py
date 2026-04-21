from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db import session, models
from datetime import datetime, timedelta
from typing import Dict, Any, List

router = APIRouter()

@router.get("/stats/{business_id}")
def get_stats(business_id: int, db: Session = Depends(session.get_db)):
    # Verify business exists
    business = db.query(models.Business).filter(models.Business.id == business_id).first()
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")

    # 1. Message volume (last 7 days)
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    message_count = db.query(models.Message).filter(
        models.Message.business_id == business_id,
        models.Message.timestamp >= seven_days_ago
    ).count()

    # 2. Tool usage breakdown
    tool_usage = db.query(
        models.AnalyticsEvent.event_data['tool'].astext.label('tool_name'),
        func.count(models.AnalyticsEvent.id)
    ).filter(
        models.AnalyticsEvent.business_id == business_id,
        models.AnalyticsEvent.event_type == 'tool_call'
    ).group_by('tool_name').all()

    # 3. Document count
    doc_count = db.query(models.Document).filter(models.Document.business_id == business_id).count()

    # 4. Recent activity
    recent_events = db.query(models.AnalyticsEvent).filter(
        models.AnalyticsEvent.business_id == business_id
    ).order_by(models.AnalyticsEvent.timestamp.desc()).limit(10).all()

    return {
        "message_volume_7d": message_count,
        "document_count": doc_count,
        "tool_usage": {name: count for name, count in tool_usage},
        "recent_activity": [
            {
                "type": e.event_type,
                "data": e.event_data,
                "timestamp": e.timestamp
            } for e in recent_events
        ]
    }
