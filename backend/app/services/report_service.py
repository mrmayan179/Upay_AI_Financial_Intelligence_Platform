"""
Smart Report & Case Management Service
Handles complaint classification, automated case routing, timeline generation, and escalation.
"""

import uuid
import re
from datetime import datetime, timedelta
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from backend.app.database.models import Complaint, Case, CaseEvent, Notification
from backend.app.services.audit_service import log_ai_activity

# Rule-based NLP Intent & Classification Engine
COMPLAINT_PATTERNS = [
    (r"fraud|unauthorized|stolen|scam|hacked|without my consent|phishing", "FRAUD", "CRITICAL", "FRAUD_INVESTIGATION"),
    (r"payment|deducted|merchant|qr|bill|recharge|not received|pending", "PAYMENT", "HIGH", "TRANSACTION_OPERATIONS"),
    (r"card|cvv|declined|nfc|international|endorsement|atm", "CARD", "MEDIUM", "CARD_SERVICES"),
    (r"cash out|agent|cashin|fee charged", "CASH_OUT", "MEDIUM", "TRANSACTION_OPERATIONS"),
    (r"bank|transfer|account number|inter-wallet", "TRANSFER", "MEDIUM", "TRANSACTION_OPERATIONS"),
    (r"refund|returned|cancellation", "REFUND", "MEDIUM", "DISPUTES"),
    (r"pin|locked|dormant|restricted|update|nid|biometric", "ACCOUNT", "LOW", "DISPUTES"),
    (r"app crash|otp|sms|network|error", "TECHNICAL", "LOW", "TECH_SUPPORT"),
]

def classify_complaint_text(text: str) -> Dict[str, Any]:
    """Intelligently classify customer dispute text into structured category and priority."""
    t_lower = text.lower()
    
    category = "OTHER"
    priority = "MEDIUM"
    team = "DISPUTES"
    confidence = 0.88
    
    for pattern, cat, prio, assigned_team in COMPLAINT_PATTERNS:
        if re.search(pattern, t_lower):
            category = cat
            priority = prio
            team = assigned_team
            confidence = 0.94 if cat == "FRAUD" else 0.91
            break
            
    summary = f"Customer reported {category.lower()} issue: '{text[:80]}...'" if len(text) > 80 else f"Dispute logged: {text}"
    
    return {
        "category": category,
        "priority": priority,
        "suggested_team": team,
        "summary": summary,
        "confidence": confidence,
        "model_provider": "upay-complaint-intel-engine",
        "version": "complaint-intel-1.0.0"
    }

def create_report_and_case(
    db: Session,
    customer_id: str,
    complaint_text: str,
    category: str = None,
    transaction_id: str = None
) -> Case:
    """Create a new complaint, auto-generate case, event timeline, and audit logs."""
    # 1. AI Classification
    intel = classify_complaint_text(complaint_text)
    final_cat = category or intel["category"]
    final_prio = intel["priority"]
    final_team = intel["suggested_team"]
    
    # 2. Record Complaint
    comp_id = f"SYN-CMP-{uuid.uuid4().hex[:6].upper()}"
    complaint = Complaint(
        complaint_id=comp_id,
        customer_id=customer_id,
        complaint_text=complaint_text,
        category=final_cat,
        priority=final_prio,
        created_at=datetime.utcnow()
    )
    db.add(complaint)
    
    # 3. Create Case
    case_num = f"UP-{uuid.uuid4().hex[:5].upper()}"
    new_case = Case(
        case_id=case_num,
        complaint_id=comp_id,
        customer_id=customer_id,
        case_title=f"{final_cat.replace('_', ' ').title()} Dispute — {case_num}",
        category=final_cat,
        priority=final_prio,
        status="UNDER_REVIEW",
        progress_percent=35,
        assigned_team=final_team,
        assigned_agent=f"AGT-{uuid.uuid4().hex[:3].upper()}",
        ai_summary=intel["summary"],
        escalation_level=0,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    db.add(new_case)
    db.flush()
    
    # 4. Generate Timeline Events
    now = datetime.utcnow()
    # Event 1: Creation
    ev1 = CaseEvent(
        event_id=f"EVT-{uuid.uuid4().hex[:8].upper()}",
        case_id=case_num,
        timestamp=now,
        event_type="CASE_CREATED",
        description=f"Complaint received via digital app channel. Case #{case_num} initiated.",
        actor_type="SYSTEM",
        actor_id="SYS-PORTAL"
    )
    # Event 2: AI Dispatch
    ev2 = CaseEvent(
        event_id=f"EVT-{uuid.uuid4().hex[:8].upper()}",
        case_id=case_num,
        timestamp=now + timedelta(seconds=2),
        event_type="ASSIGNED",
        description=f"Auto-routed to {final_team} based on {final_prio} priority scoring.",
        actor_type="AI_COPILOT",
        actor_id="AI-DISPATCHER"
    )
    # Event 3: Context Retrieval
    ev3 = CaseEvent(
        event_id=f"EVT-{uuid.uuid4().hex[:8].upper()}",
        case_id=case_num,
        timestamp=now + timedelta(seconds=5),
        event_type="INVESTIGATION_STARTED",
        description="Transaction ledger data attached for operator verification.",
        actor_type="AGENT",
        actor_id=new_case.assigned_agent
    )
    db.add_all([ev1, ev2, ev3])
    
    # 5. In-app Notification
    notif = Notification(
        notification_id=f"NOTIF-{uuid.uuid4().hex[:8].upper()}",
        customer_id=customer_id,
        title=f"Case #{case_num} Created",
        message=f"Your dispute has been assigned to {final_team}. We are currently investigating.",
        type="CASE",
        action_url=f"/reports/{case_num}",
        created_at=now
    )
    db.add(notif)
    
    # 6. Audit Trail
    log_ai_activity(
        db=db,
        correlation_id=case_num,
        customer_id=customer_id,
        component="REPORT_COPILOT",
        action="COMPLAINT_CLASSIFICATION_AND_DISPATCH",
        tool_name="classify_and_create_case",
        model_or_provider=intel["model_provider"],
        model_version=intel["version"],
        result_status="SUCCESS",
        latency_ms=18.5,
        details={"category": final_cat, "priority": final_prio, "confidence": intel["confidence"]}
    )
    
    db.commit()
    db.refresh(new_case)
    return new_case

def get_active_cases(db: Session, customer_id: str) -> List[Case]:
    """Retrieve only active (non-closed) cases for customer display."""
    return db.query(Case).filter(
        Case.customer_id == customer_id,
        Case.status.in_(["OPEN", "UNDER_REVIEW", "INVESTIGATING", "WAITING_FOR_CUSTOMER", "ESCALATED"])
    ).order_by(Case.created_at.desc()).all()

def get_case_detail(db: Session, case_id: str) -> Dict[str, Any]:
    """Retrieve full case details along with ordered event timeline."""
    c = db.query(Case).filter(Case.case_id == case_id).first()
    if not c:
        return None
    events = db.query(CaseEvent).filter(CaseEvent.case_id == case_id).order_by(CaseEvent.timestamp.asc()).all()
    
    return {
        "case_id": c.case_id,
        "complaint_id": c.complaint_id,
        "case_title": c.case_title,
        "category": c.category,
        "priority": c.priority,
        "status": c.status,
        "progress_percent": c.progress_percent,
        "assigned_team": c.assigned_team,
        "assigned_agent": c.assigned_agent,
        "ai_summary": c.ai_summary,
        "escalation_level": c.escalation_level,
        "created_at": c.created_at.isoformat(),
        "updated_at": c.updated_at.isoformat(),
        "events": [
            {
                "event_id": ev.event_id,
                "case_id": ev.case_id,
                "timestamp": ev.timestamp.isoformat(),
                "event_type": ev.event_type,
                "description": ev.description,
                "actor_type": ev.actor_type,
                "actor_id": ev.actor_id
            }
            for ev in events
        ]
    }

def escalate_case(db: Session, case_id: str, reason: str) -> Case:
    """Escalate a case to Tier 2 supervisory queue."""
    c = db.query(Case).filter(Case.case_id == case_id).first()
    if not c:
        return None
        
    c.status = "ESCALATED"
    c.escalation_level += 1
    c.priority = "CRITICAL"
    c.updated_at = datetime.utcnow()
    
    # Add Escalation Event
    ev = CaseEvent(
        event_id=f"EVT-{uuid.uuid4().hex[:8].upper()}",
        case_id=case_id,
        timestamp=datetime.utcnow(),
        event_type="ESCALATED",
        description=f"Case escalated to Senior Operations Specialist. Reason: {reason}",
        actor_type="AI_COPILOT",
        actor_id="AI-ESCALATION-MONITOR"
    )
    db.add(ev)
    
    # Notify customer
    notif = Notification(
        notification_id=f"NOTIF-{uuid.uuid4().hex[:8].upper()}",
        customer_id=c.customer_id,
        title=f"Case #{case_id} Escalated",
        message="Your dispute has been prioritized to our supervisor queue for expedited handling.",
        type="CASE",
        action_url=f"/reports/{case_id}",
        created_at=datetime.utcnow()
    )
    db.add(notif)
    
    log_ai_activity(
        db=db,
        correlation_id=case_id,
        customer_id=c.customer_id,
        component="REPORT_COPILOT",
        action="DISPUTE_ESCALATION",
        tool_name="escalate_case",
        model_or_provider="supervisor-rule-engine",
        model_version="1.0",
        result_status="SUCCESS",
        latency_ms=10.0,
        details={"escalation_level": c.escalation_level, "reason": reason}
    )
    
    db.commit()
    db.refresh(c)
    return c
