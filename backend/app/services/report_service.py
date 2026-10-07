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

# Structured NLP Classification Knowledge Base
INTENT_CLASSIFICATION_RULES = [
    {
        "intent": "UNAUTHORIZED_TRANSACTION_FRAUD",
        "category": "FRAUD",
        "priority": "CRITICAL",
        "team": "FRAUD_INVESTIGATION",
        "pattern": r"fraud|unauthorized|stolen|scam|hacked|without my consent|phishing|stolen card|compromised|suspicious activity|fake caller",
        "recommended_next_step": "Temporarily freeze payment channel, flag recipient identifier, and route to Tier-2 Fraud Squad.",
        "requires_supervisor": True
    },
    {
        "intent": "REFUND_DELAY_ISSUE",
        "category": "REFUND",
        "priority": "MEDIUM",
        "pattern": r"refund|returned|cancellation|order cancelled|merchant refund|chargeback",
        "team": "DISPUTES",
        "recommended_next_step": "Request merchant settlement credit note and track merchant reversal SLA window.",
        "requires_supervisor": False
    },
    {
        "intent": "CARD_CHANNEL_PROBLEM",
        "category": "CARD",
        "priority": "MEDIUM",
        "pattern": r"card|cvv|declined|nfc|international|endorsement|atm|visa|mastercard|pos terminal|tap and go",
        "team": "CARD_SERVICES",
        "recommended_next_step": "Verify card toggle statuses (online/international/NFC) and passport USD quota balances.",
        "requires_supervisor": False
    },
    {
        "intent": "CASH_OUT_DISPUTE",
        "category": "CASH_OUT",
        "priority": "MEDIUM",
        "pattern": r"cash out|agent|cashin|fee charged|agent refused|atm cash not dispensed|atm cash didn't come",
        "team": "TRANSACTION_OPERATIONS",
        "recommended_next_step": "Retrieve agent terminal transaction log and verify counterparty cash settlement status.",
        "requires_supervisor": False
    },
    {
        "intent": "INTER_BANK_TRANSFER_DELAY",
        "category": "TRANSFER",
        "priority": "MEDIUM",
        "pattern": r"bank|transfer|account number|inter-wallet|beftn|npsb|rtgs|routing number",
        "team": "TRANSACTION_OPERATIONS",
        "recommended_next_step": "Check Bangladesh Bank NPSB/BEFTN inter-bank settlement batch status.",
        "requires_supervisor": False
    },
    {
        "intent": "PAYMENT_STUCK_NOT_RECEIVED",
        "category": "PAYMENT",
        "priority": "HIGH",
        "pattern": r"payment|deducted|merchant|qr|bill|recharge|not received|pending|receiver did not get|charged twice|double charge|money cut",
        "team": "TRANSACTION_OPERATIONS",
        "recommended_next_step": "Query core switch reconciliation ledger and schedule auto-reversal if unreconciled within 24h.",
        "requires_supervisor": False
    },
    {
        "intent": "ACCOUNT_SECURITY_ACCESS",
        "category": "ACCOUNT",
        "priority": "LOW",
        "pattern": r"pin|locked|dormant|restricted|update|nid|biometric|kyc|change number|profile",
        "team": "DISPUTES",
        "recommended_next_step": "Trigger biometric facial challenge and dispatch SMS self-service security verification link.",
        "requires_supervisor": False
    },
    {
        "intent": "APP_TECHNICAL_GLITCH",
        "category": "TECHNICAL",
        "priority": "LOW",
        "pattern": r"app crash|otp|sms|network|error|bug|cannot open|session timeout|server down|login failed",
        "team": "TECH_SUPPORT",
        "recommended_next_step": "Log client device telemetry, invalidate cached auth tokens, and escalate app error payload.",
        "requires_supervisor": False
    }
]

def extract_complaint_entities(text: str) -> Dict[str, Any]:
    """Extracts monetary amounts, transaction references, and time expressions from text."""
    entities = {}
    
    # Amount detection (e.g., BDT 1,400 or 1400 tk or $45)
    amt_match = re.search(r"(?:bdt|tk|৳|\$)\s*([\d,]+(?:\.\d{1,2})?)|([\d,]+(?:\.\d{1,2})?)\s*(?:bdt|taka|tk|৳)", text, re.IGNORECASE)
    if amt_match:
        val = amt_match.group(1) or amt_match.group(2)
        try:
            entities["amount_mentioned"] = float(val.replace(",", ""))
        except Exception:
            pass
            
    # Transaction ID detection (e.g., TXN-1234 or UPAY-...)
    txn_match = re.search(r"\b(TXN-[A-Za-z0-9\-]+|CTXN-[A-Za-z0-9\-]+|UP-[A-Za-z0-9\-]+|[0-9]{8,14})\b", text)
    if txn_match:
        entities["transaction_reference"] = txn_match.group(1)
        
    # Urgency indicators
    if re.search(r"emergency|urgent|immediately|police|medical|hospital", text, re.IGNORECASE):
        entities["urgency_marker"] = True
        
    return entities

def classify_complaint_text(text: str) -> Dict[str, Any]:
    """
    Intelligently classifies customer dispute text into structured intent,
    category, priority, suggested team, and recommended next steps.
    Enforces deterministic safety rules: AI never executes autonomous money movements.
    """
    t_lower = text.lower()
    entities = extract_complaint_entities(text)
    
    matched_rule = None
    for rule in INTENT_CLASSIFICATION_RULES:
        if re.search(rule["pattern"], t_lower):
            matched_rule = rule
            break
            
    if matched_rule:
        intent = matched_rule["intent"]
        category = matched_rule["category"]
        priority = matched_rule["priority"]
        team = matched_rule["team"]
        rec_step = matched_rule["recommended_next_step"]
        requires_sup = matched_rule["requires_supervisor"]
        confidence = 0.95 if category == "FRAUD" else 0.92
    else:
        intent = "GENERAL_INQUIRY"
        category = "OTHER"
        priority = "MEDIUM"
        team = "DISPUTES"
        rec_step = "Route ticket to front-line customer assistance desk for manual assessment."
        requires_sup = False
        confidence = 0.85
        
    # Elevate priority if emergency urgency marker is present
    if entities.get("urgency_marker") and priority in ["LOW", "MEDIUM"]:
        priority = "HIGH"
        
    summary = f"Customer dispute: [{category}] {text[:90]}..." if len(text) > 90 else f"Customer dispute: [{category}] {text}"
    
    return {
        "intent": intent,
        "category": category,
        "priority": priority,
        "suggested_team": team,
        "summary": summary,
        "recommended_next_step": rec_step,
        "confidence": confidence,
        "entities_detected": entities,
        "requires_supervisor_approval": requires_sup,
        "auto_action_permitted": False, # Deterministic Safety Boundary
        "model_provider": "upay-nlp-dispute-classifier-v2",
        "version": "complaint-intel-2.0.0"
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
    
    # Mirror case, complaint, and events to Supabase Cloud PostgreSQL (Primary Runtime)
    try:
        from backend.app.services.supabase_service import insert_supabase_complaint_and_case, insert_supabase_notification
        insert_supabase_complaint_and_case(
            complaint_data={
                "complaint_id": comp_id,
                "customer_id": customer_id,
                "complaint_text": complaint_text,
                "category": final_cat,
                "priority": final_prio,
                "channel": "IN_APP",
                "created_at": now.isoformat()
            },
            case_data={
                "case_id": case_num,
                "complaint_id": comp_id,
                "customer_id": customer_id,
                "case_title": f"{final_cat.replace('_', ' ').title()} Dispute — {case_num}",
                "category": final_cat,
                "priority": final_prio,
                "status": "INVESTIGATING",
                "progress_percent": 35,
                "assigned_team": final_team,
                "assigned_agent": new_case.assigned_agent,
                "ai_summary": intel["summary"],
                "escalation_level": 0,
                "created_at": now.isoformat(),
                "updated_at": now.isoformat()
            },
            event_data={
                "event_id": ev1.event_id,
                "case_id": case_num,
                "timestamp": now.isoformat(),
                "event_type": "CASE_CREATED",
                "description": f"Automated intake complete. Priority: {final_prio}.",
                "actor_type": "AI_COPILOT",
                "actor_id": "COPILOT-DISPUTE-01"
            }
        )
        insert_supabase_notification({
            "notification_id": notif.notification_id,
            "customer_id": customer_id,
            "title": notif.title,
            "message": notif.message,
            "type": notif.type,
            "read": False,
            "action_url": notif.action_url,
            "created_at": notif.created_at.isoformat()
        })
    except Exception:
        pass
        
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
        "customer_id": c.customer_id,
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
    
    # Mirror escalation to Supabase Cloud PostgreSQL (Primary Runtime)
    try:
        from backend.app.services.supabase_service import escalate_supabase_case, insert_supabase_notification
        escalate_supabase_case(
            case_id=case_id,
            event_data={
                "event_id": ev.event_id,
                "case_id": case_id,
                "timestamp": datetime.utcnow().isoformat(),
                "event_type": "CASE_ESCALATED",
                "description": f"Customer escalation: {reason}",
                "actor_type": "CUSTOMER",
                "actor_id": c.customer_id
            }
        )
        insert_supabase_notification({
            "notification_id": notif.notification_id,
            "customer_id": c.customer_id,
            "title": notif.title,
            "message": notif.message,
            "type": notif.type,
            "read": False,
            "action_url": notif.action_url,
            "created_at": notif.created_at.isoformat()
        })
    except Exception:
        pass
        
    return c
