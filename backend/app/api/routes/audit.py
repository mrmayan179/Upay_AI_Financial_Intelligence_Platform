"""
Shared AI Governance & Activity Audit Routes
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
import json
from backend.app.database.connection import get_db
from backend.app.database.models import AIActivityLog
from backend.app.schemas.payloads import AIActivityLogSchema

router = APIRouter(prefix="/audit", tags=["Governance & Observability"])

@router.get("/logs", response_model=List[AIActivityLogSchema])
def get_audit_logs(
    component: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    query = db.query(AIActivityLog)
    if component:
        query = query.filter(AIActivityLog.component == component)
    logs = query.order_by(AIActivityLog.created_at.desc()).limit(limit).all()
    
    return [
        {
            "ai_log_id": log.ai_log_id,
            "correlation_id": log.correlation_id,
            "customer_id": log.customer_id,
            "component": log.component,
            "action": log.action,
            "tool_name": log.tool_name,
            "model_or_provider": log.model_or_provider,
            "model_version": log.model_version,
            "result_status": log.result_status,
            "latency_ms": log.latency_ms,
            "details": json.loads(log.details) if log.details else {},
            "created_at": log.created_at.isoformat()
        }
        for log in logs
    ]
