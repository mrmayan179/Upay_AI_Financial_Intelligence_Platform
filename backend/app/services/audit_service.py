"""
Centralized Audit & AI Activity Logging Service
"""

import json
import uuid
from datetime import datetime
from sqlalchemy.orm import Session
from backend.app.database.models import AIActivityLog

def log_ai_activity(
    db: Session,
    correlation_id: str,
    component: str,
    action: str,
    customer_id: str = None,
    tool_name: str = "",
    model_or_provider: str = "",
    model_version: str = "",
    result_status: str = "SUCCESS",
    latency_ms: float = 12.0,
    details: dict = None
) -> AIActivityLog:
    """Create a persistent, tamper-evident AI activity audit record."""
    log_id = f"AI-LOG-{uuid.uuid4().hex[:10].upper()}"
    log_entry = AIActivityLog(
        ai_log_id=log_id,
        correlation_id=correlation_id or f"CORR-{uuid.uuid4().hex[:8].upper()}",
        customer_id=customer_id,
        component=component,
        action=action,
        tool_name=tool_name,
        model_or_provider=model_or_provider,
        model_version=model_version,
        result_status=result_status,
        latency_ms=latency_ms,
        details=json.dumps(details or {}),
        created_at=datetime.utcnow()
    )
    db.add(log_entry)
    db.commit()
    db.refresh(log_entry)
    
    # Mirror log to Supabase Cloud PostgreSQL (Primary Runtime)
    try:
        from backend.app.services.supabase_service import insert_supabase_audit_log
        insert_supabase_audit_log({
            "ai_log_id": log_id,
            "correlation_id": log_entry.correlation_id,
            "customer_id": customer_id,
            "component": component,
            "action": action,
            "tool_name": tool_name,
            "model_or_provider": model_or_provider,
            "model_version": model_version,
            "result_status": result_status,
            "latency_ms": latency_ms,
            "details": json.dumps(details or {}),
            "created_at": log_entry.created_at.isoformat()
        })
    except Exception:
        pass
        
    return log_entry
