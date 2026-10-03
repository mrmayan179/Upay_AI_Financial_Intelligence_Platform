"""
Database Seed Script for Upay AI Platform
Populates database with authentic demo user, cards, dispute cases, credit profile, and audit trails.
"""

import sys
import json
from pathlib import Path
from datetime import datetime, timedelta

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from backend.app.database.connection import engine, Base, SessionLocal
from backend.app.database.models import (
    Customer, Card, CardTransaction, Complaint, Case, CaseEvent,
    CreditRecommendation, AIActivityLog, Notification
)

def seed_database():
    print("=" * 60)
    print("INITIALIZING & SEEDING UPAY PLATFORM DATABASE")
    print("=" * 60)
    
    # Create all tables
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    # Check if already seeded
    if db.query(Customer).filter(Customer.customer_id == "SYN-U-10082").first():
        print("[INFO] Database already seeded. Skipping initialization.")
        db.close()
        return
        
    print("[1/6] Seeding Customer Profile (TANVIR KABIR)...")
    customer = Customer(
        customer_id="SYN-U-10082",
        display_name="TANVIR KABIR",
        phone_masked="01771 ••• 164",
        raw_phone="01771449164",
        dob="1994-08-15",
        father_name_demo="MD. SHAHIDUL ISLAM",
        account_number="01771449164-9",
        account_balance_bdt=25450.00,
        cash_reward_bdt=150.00,
        status="ACTIVE",
        pin_hash="1234",
        created_at=datetime.utcnow() - timedelta(days=840)
    )
    db.add(customer)
    
    print("[2/6] Seeding Smart Cards & Initial Authorizations...")
    card1 = Card(
        card_id="SYN-CRD-10082-1",
        customer_id="SYN-U-10082",
        card_type="DUAL_CURRENCY",
        card_title="Upay Global Smart Card",
        card_number_masked="•••• •••• •••• 4821",
        card_number_full="4532 8912 6543 4821",
        expiry_date="12/29",
        cvv="123",
        status="ACTIVE",
        card_enabled=True,
        online_enabled=True,
        international_enabled=True,
        nfc_enabled=True,
        endorsement_usd=1200.0,
        used_usd=340.0,
        created_at=datetime.utcnow() - timedelta(days=120)
    )
    
    card2 = Card(
        card_id="SYN-CRD-10082-2",
        customer_id="SYN-U-10082",
        card_type="VIRTUAL_PREPAID",
        card_title="Upay Virtual Prepaid Card",
        card_number_masked="•••• •••• •••• 9012",
        card_number_full="5412 7534 8921 9012",
        expiry_date="08/28",
        cvv="456",
        status="ACTIVE",
        card_enabled=True,
        online_enabled=True,
        international_enabled=False,
        nfc_enabled=False,
        endorsement_usd=0.0,
        used_usd=0.0,
        created_at=datetime.utcnow() - timedelta(days=60)
    )
    db.add_all([card1, card2])
    
    # Sample card transactions
    ctxn1 = CardTransaction(
        transaction_id="CTXN-US-101",
        card_id="SYN-CRD-10082-1",
        customer_id="SYN-U-10082",
        amount_usd=45.00,
        amount_bdt=5467.50,
        merchant_name="Coursera Inc.",
        channel="ONLINE",
        country="US",
        risk_score=12,
        risk_level="LOW",
        decision="ALLOW",
        reasons=json.dumps(["Normal online subscription merchant", "Recurring device fingerprint"]),
        status="APPROVED",
        created_at=datetime.utcnow() - timedelta(days=14)
    )
    ctxn2 = CardTransaction(
        transaction_id="CTXN-SG-102",
        card_id="SYN-CRD-10082-1",
        customer_id="SYN-U-10082",
        amount_usd=85.00,
        amount_bdt=10327.50,
        merchant_name="Agoda Travel SG",
        channel="ONLINE",
        country="SG",
        risk_score=22,
        risk_level="LOW",
        decision="ALLOW",
        reasons=json.dumps(["Standard travel portal", "Card international enabled"]),
        status="APPROVED",
        created_at=datetime.utcnow() - timedelta(days=6)
    )
    ctxn3 = CardTransaction(
        transaction_id="CTXN-AE-103",
        card_id="SYN-CRD-10082-1",
        customer_id="SYN-U-10082",
        amount_usd=210.00,
        amount_bdt=25515.00,
        merchant_name="Emirates Duty Free",
        channel="POS",
        country="AE",
        risk_score=28,
        risk_level="LOW",
        decision="ALLOW",
        reasons=json.dumps(["Verified terminal chip authorization"]),
        status="APPROVED",
        created_at=datetime.utcnow() - timedelta(days=2)
    )
    db.add_all([ctxn1, ctxn2, ctxn3])
    
    print("[3/6] Seeding Smart Report Cases & Timeline Events...")
    # Case 1: Active Payment dispute
    comp1 = Complaint(
        complaint_id="SYN-CMP-10482",
        customer_id="SYN-U-10082",
        complaint_text="Money was deducted from Upay balance (BDT 1,400) but grocery merchant terminal did not receive confirmation slip.",
        category="PAYMENT",
        priority="HIGH",
        created_at=datetime.utcnow() - timedelta(hours=6)
    )
    case1 = Case(
        case_id="UP-10482",
        complaint_id="SYN-CMP-10482",
        customer_id="SYN-U-10082",
        case_title="Payment Deduction Dispute — UP-10482",
        category="PAYMENT",
        priority="HIGH",
        status="INVESTIGATING",
        progress_percent=70,
        assigned_team="TRANSACTION_OPERATIONS",
        assigned_agent="AGT-408",
        ai_summary="Duplicate charge / delayed confirmation during merchant QR checkout. Bank settlement reconciliation requested.",
        escalation_level=0,
        created_at=datetime.utcnow() - timedelta(hours=6),
        updated_at=datetime.utcnow() - timedelta(hours=1)
    )
    db.add_all([comp1, case1])
    
    ev1_1 = CaseEvent(
        event_id="EVT-10482-1",
        case_id="UP-10482",
        timestamp=datetime.utcnow() - timedelta(hours=6),
        event_type="CASE_CREATED",
        description="Customer reported dispute through in-app Report Center.",
        actor_type="CUSTOMER",
        actor_id="SYN-U-10082"
    )
    ev1_2 = CaseEvent(
        event_id="EVT-10482-2",
        case_id="UP-10482",
        timestamp=datetime.utcnow() - timedelta(hours=5, minutes=50),
        event_type="ASSIGNED",
        description="Complaint AI classified as PAYMENT (High Priority). Assigned to Transaction Operations.",
        actor_type="AI_COPILOT",
        actor_id="AI-DISPATCHER"
    )
    ev1_3 = CaseEvent(
        event_id="EVT-10482-3",
        case_id="UP-10482",
        timestamp=datetime.utcnow() - timedelta(hours=3),
        event_type="INVESTIGATION_STARTED",
        description="Operator retrieved merchant settlement logs. Auto-reversal scheduled within 24 hours.",
        actor_type="AGENT",
        actor_id="AGT-408"
    )
    db.add_all([ev1_1, ev1_2, ev1_3])
    
    # Case 2: Card dispute
    comp2 = Complaint(
        complaint_id="SYN-CMP-20194",
        customer_id="SYN-U-10082",
        complaint_text="Dual currency card online international transaction toggle was disabled unexpectedly.",
        category="CARD",
        priority="MEDIUM",
        created_at=datetime.utcnow() - timedelta(days=1)
    )
    case2 = Case(
        case_id="UP-20194",
        complaint_id="SYN-CMP-20194",
        customer_id="SYN-U-10082",
        case_title="Card Toggle Status Issue — UP-20194",
        category="CARD",
        priority="MEDIUM",
        status="UNDER_REVIEW",
        progress_percent=35,
        assigned_team="CARD_SERVICES",
        assigned_agent="AGT-412",
        ai_summary="Passport endorsement quota refresh sync anomaly.",
        escalation_level=0,
        created_at=datetime.utcnow() - timedelta(days=1),
        updated_at=datetime.utcnow() - timedelta(hours=18)
    )
    db.add_all([comp2, case2])
    
    print("[4/6] Seeding Credit Readiness Profile...")
    pos_factors = [
        "+ Stable monthly salary inflow exceeding BDT 65,000",
        "+ 100% on-time historical micro-credit repayment track record",
        "+ Healthy average daily wallet balance retention (>65%)"
    ]
    neg_factors = [
        "- Elevated cash-out ratio (28% of incoming funds converted to physical cash)",
        "- Limited utility bill payment history recorded through Upay app"
    ]
    credit = CreditRecommendation(
        recommendation_id="CRED-10082-1",
        customer_id="SYN-U-10082",
        readiness_score=86,
        risk_probability=0.14,
        risk_category="LOW / DEMO RISK",
        suggested_limit_range_bdt="BDT 20,000 - BDT 30,000",
        recommendation="RECOMMENDED_FOR_PARTNER_REVIEW",
        positive_factors=json.dumps(pos_factors),
        negative_factors=json.dumps(neg_factors),
        review_requested=False,
        review_status="NOT_REQUESTED",
        model_version="credit-xgb-1.0.0",
        created_at=datetime.utcnow()
    )
    db.add(credit)
    
    print("[5/6] Seeding In-App Notifications...")
    n1 = Notification(
        notification_id="NOTIF-01",
        customer_id="SYN-U-10082",
        title="Dispute Case #UP-10482 Updated",
        message="Transaction Operations operator AGT-408 has verified merchant logs. Auto-reversal scheduled.",
        type="CASE",
        action_url="/reports/UP-10482",
        created_at=datetime.utcnow() - timedelta(hours=3)
    )
    n2 = Notification(
        notification_id="NOTIF-02",
        customer_id="SYN-U-10082",
        title="Credit Readiness Profile Ready",
        message="Your AI Credit Readiness Score is 86/100. Check your suggested borrowing range.",
        type="CREDIT",
        action_url="/credit",
        created_at=datetime.utcnow() - timedelta(days=1)
    )
    n3 = Notification(
        notification_id="NOTIF-03",
        customer_id="SYN-U-10082",
        title="Upay Global Smart Card Active",
        message="Your dual-currency card with $1,200 USD endorsement is ready for online and tap-and-go payments.",
        type="SECURITY",
        action_url="/cards",
        created_at=datetime.utcnow() - timedelta(days=3)
    )
    db.add_all([n1, n2, n3])
    
    print("[6/6] Seeding Initial AI Activity Logs...")
    l1 = AIActivityLog(
        ai_log_id="AI-LOG-INIT-1",
        correlation_id="UP-10482",
        customer_id="SYN-U-10082",
        component="REPORT_COPILOT",
        action="COMPLAINT_CLASSIFICATION_AND_DISPATCH",
        tool_name="classify_and_create_case",
        model_or_provider="upay-complaint-intel-engine",
        model_version="complaint-intel-1.0.0",
        result_status="SUCCESS",
        latency_ms=16.8,
        details=json.dumps({"category": "PAYMENT", "priority": "HIGH", "confidence": 0.94}),
        created_at=datetime.utcnow() - timedelta(hours=6)
    )
    l2 = AIActivityLog(
        ai_log_id="AI-LOG-INIT-2",
        correlation_id="CRED-10082-1",
        customer_id="SYN-U-10082",
        component="CREDIT_ENGINE",
        action="CREDIT_READINESS_SCORING",
        tool_name="predict_credit",
        model_or_provider="credit-xgboost",
        model_version="credit-xgb-1.0.0",
        result_status="SUCCESS",
        latency_ms=21.4,
        details=json.dumps({"readiness_score": 86, "risk_category": "LOW"}),
        created_at=datetime.utcnow() - timedelta(days=1)
    )
    db.add_all([l1, l2])
    
    db.commit()
    db.close()
    print("-" * 60)
    print("SUCCESS: Database initialized and seeded successfully!")
    print("-" * 60)

if __name__ == "__main__":
    seed_database()
