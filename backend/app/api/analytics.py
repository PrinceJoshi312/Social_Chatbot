from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db import session, models
from datetime import datetime, timedelta
from typing import Dict, Any, List

router = APIRouter()

@router.get("/stats/{business_id}")
def get_stats(business_id: int, db: Session = Depends(session.get_db)):
    business = db.query(models.Business).filter(models.Business.id == business_id).first()
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")

    # 1. Message volume (last 7 days)
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    message_count = db.query(models.Message).filter(
        models.Message.business_id == business_id,
        models.Message.timestamp >= seven_days_ago
    ).count()

    # 2. Daily Volume for Chart
    chart_data = []
    for i in range(6, -1, -1):
        day = (datetime.utcnow() - timedelta(days=i)).date()
        count = db.query(models.Message).filter(
            models.Message.business_id == business_id,
            func.date(models.Message.timestamp) == day
        ).count()
        chart_data.append({"name": day.strftime("%a"), "messages": count})

    # 3. Tool usage
    tool_events = db.query(models.AnalyticsEvent).filter(
        models.AnalyticsEvent.business_id == business_id,
        models.AnalyticsEvent.event_type == 'tool_call'
    ).all()
    tool_usage = {}
    for event in tool_events:
        tool_name = event.event_data.get('tool', 'unknown')
        tool_usage[tool_name] = tool_usage.get(tool_name, 0) + 1

    doc_count = db.query(models.Document).filter(models.Document.business_id == business_id).count()

    # 4. Recent activity
    recent_events = db.query(models.AnalyticsEvent).filter(
        models.AnalyticsEvent.business_id == business_id
    ).order_by(models.AnalyticsEvent.timestamp.desc()).limit(10).all()

    return {
        "message_volume_7d": message_count,
        "document_count": doc_count,
        "tool_usage": tool_usage,
        "chart_data": chart_data,
        "recent_activity": [
            {
                "type": e.event_type,
                "data": e.event_data,
                "timestamp": e.timestamp
            } for e in recent_events
        ]
    }

@router.get("/system-wide")
def get_system_stats(db: Session = Depends(session.get_db)):
    biz_count = db.query(models.Business).count()
    user_count = db.query(models.User).count()
    msg_count = db.query(models.Message).count()
    doc_count = db.query(models.Document).count()
    
    last_24h = datetime.utcnow() - timedelta(hours=24)
    active_bots = db.query(models.Message.business_id).filter(
        models.Message.timestamp >= last_24h
    ).distinct().count()

    # System-wide chart data (Total messages per day)
    system_chart = []
    for i in range(6, -1, -1):
        day = (datetime.utcnow() - timedelta(days=i)).date()
        count = db.query(models.Message).filter(func.date(models.Message.timestamp) == day).count()
        system_chart.append({"name": day.strftime("%a"), "total": count})

    recent_biz = db.query(models.Business).order_by(models.Business.created_at.desc()).limit(5).all()

    return {
        "total_businesses": biz_count,
        "total_users": user_count,
        "total_messages": msg_count,
        "total_documents": doc_count,
        "active_last_24h": active_bots,
        "system_chart": system_chart,
        "recent_businesses": [
            {
                "id": b.id,
                "name": b.name,
                "created_at": b.created_at
            } for b in recent_biz
        ]
    }
