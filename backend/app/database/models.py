"""
Database ORM Entities for Upay AI Platform
"""

from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.database.connection import Base

class Customer(Base):
    __tablename__ = "customers"
    
    customer_id = Column(String(50), primary_key=True)
    display_name = Column(String(100), nullable=False)
    phone_masked = Column(String(20), nullable=False)
    raw_phone = Column(String(20), nullable=False)
    dob = Column(String(20), nullable=False)
    father_name_demo = Column(String(100), nullable=False)
    account_number = Column(String(30), nullable=False)
    account_balance_bdt = Column(Float, default=25450.00)
    cash_reward_bdt = Column(Float, default=150.00)
    status = Column(String(20), default="ACTIVE")
    pin_hash = Column(String(100), default="1234")
    created_at = Column(DateTime, default=datetime.utcnow)

class Card(Base):
    __tablename__ = "cards"
    
    card_id = Column(String(50), primary_key=True)
    customer_id = Column(String(50), ForeignKey("customers.customer_id"), nullable=False)
    card_type = Column(String(50), default="DUAL_CURRENCY")
    card_title = Column(String(100), default="Upay Global Smart Card")
    card_number_masked = Column(String(30), default="•••• •••• •••• 4821")
    card_number_full = Column(String(30), default="4532 8912 6543 4821")
    expiry_date = Column(String(10), default="12/29")
    cvv = Column(String(5), default="123")
    status = Column(String(20), default="ACTIVE") # ACTIVE, FROZEN, BLOCKED
    card_enabled = Column(Boolean, default=True)
    online_enabled = Column(Boolean, default=True)
    international_enabled = Column(Boolean, default=True)
    nfc_enabled = Column(Boolean, default=True)
    endorsement_usd = Column(Float, default=1200.0)
    used_usd = Column(Float, default=340.0)
    created_at = Column(DateTime, default=datetime.utcnow)

class CardTransaction(Base):
    __tablename__ = "card_transactions"
    
    transaction_id = Column(String(50), primary_key=True)
    card_id = Column(String(50), ForeignKey("cards.card_id"), nullable=False)
    customer_id = Column(String(50), nullable=False)
    amount_usd = Column(Float, nullable=False)
    amount_bdt = Column(Float, default=0.0)
    merchant_name = Column(String(100), nullable=False)
    channel = Column(String(30), default="ONLINE") # ONLINE, POS, CONTACTLESS, ATM
    country = Column(String(10), default="US")
    risk_score = Column(Integer, default=15)
    risk_level = Column(String(20), default="LOW") # LOW, MEDIUM, HIGH, CRITICAL
    decision = Column(String(20), default="ALLOW") # ALLOW, CHALLENGE_2FA, HOLD_FOR_REVIEW, BLOCK
    reasons = Column(Text, default="[]")
    status = Column(String(30), default="APPROVED")
    created_at = Column(DateTime, default=datetime.utcnow)

class Complaint(Base):
    __tablename__ = "complaints"
    
    complaint_id = Column(String(50), primary_key=True)
    customer_id = Column(String(50), nullable=False)
    complaint_text = Column(Text, nullable=False)
    category = Column(String(50), nullable=False)
    priority = Column(String(20), default="MEDIUM")
    channel = Column(String(20), default="IN_APP")
    created_at = Column(DateTime, default=datetime.utcnow)

class Case(Base):
    __tablename__ = "cases"
    
    case_id = Column(String(50), primary_key=True)
    complaint_id = Column(String(50), nullable=False)
    customer_id = Column(String(50), nullable=False)
    case_title = Column(String(150), nullable=False)
    category = Column(String(50), nullable=False)
    priority = Column(String(20), default="MEDIUM")
    status = Column(String(30), default="INVESTIGATING") # OPEN, UNDER_REVIEW, INVESTIGATING, WAITING_FOR_CUSTOMER, ESCALATED, RESOLVED, CLOSED
    progress_percent = Column(Integer, default=50)
    assigned_team = Column(String(80), default="TRANSACTION_OPERATIONS")
    assigned_agent = Column(String(50), default="AGT-408")
    ai_summary = Column(Text, default="")
    escalation_level = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)

class CaseEvent(Base):
    __tablename__ = "case_events"
    
    event_id = Column(String(50), primary_key=True)
    case_id = Column(String(50), ForeignKey("cases.case_id"), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    event_type = Column(String(50), nullable=False)
    description = Column(Text, nullable=False)
    actor_type = Column(String(30), default="SYSTEM") # SYSTEM, AI_COPILOT, AGENT, CUSTOMER
    actor_id = Column(String(50), default="SYS-AUTO")

class CreditRecommendation(Base):
    __tablename__ = "credit_recommendations"
    
    recommendation_id = Column(String(50), primary_key=True)
    customer_id = Column(String(50), nullable=False)
    readiness_score = Column(Integer, default=86)
    risk_probability = Column(Float, default=0.14)
    risk_category = Column(String(20), default="LOW")
    suggested_limit_range_bdt = Column(String(50), default="BDT 20,000 - BDT 30,000")
    recommendation = Column(String(50), default="RECOMMENDED_FOR_PARTNER_REVIEW")
    positive_factors = Column(Text, default="[]")
    negative_factors = Column(Text, default="[]")
    review_requested = Column(Boolean, default=False)
    review_requested_at = Column(DateTime, nullable=True)
    review_status = Column(String(50), default="NOT_REQUESTED") # NOT_REQUESTED, UNDER_BANK_REVIEW, APPROVED_BY_BANK
    model_version = Column(String(50), default="credit-xgb-1.0.0")
    created_at = Column(DateTime, default=datetime.utcnow)

class VoiceCall(Base):
    __tablename__ = "voice_calls"
    
    call_id = Column(String(50), primary_key=True)
    customer_id = Column(String(50), nullable=True)
    phone_number = Column(String(20), default="01771449164")
    verified = Column(Boolean, default=False)
    intent = Column(String(50), default="INQUIRY")
    status = Column(String(30), default="ACTIVE") # ACTIVE, COMPLETED, ESCALATED
    escalated = Column(Boolean, default=False)
    escalation_team = Column(String(80), nullable=True)
    call_duration_seconds = Column(Integer, default=0)
    summary = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)

class VoiceTranscript(Base):
    __tablename__ = "voice_transcripts"
    
    transcript_id = Column(String(50), primary_key=True)
    call_id = Column(String(50), ForeignKey("voice_calls.call_id"), nullable=False)
    speaker = Column(String(20), nullable=False) # CALLER, AI_AGENT, HUMAN_AGENT, SYSTEM
    text = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)

class AIActivityLog(Base):
    __tablename__ = "ai_activity_logs"
    
    ai_log_id = Column(String(50), primary_key=True)
    correlation_id = Column(String(50), nullable=False)
    customer_id = Column(String(50), nullable=True)
    component = Column(String(50), nullable=False) # FRAUD_ENGINE, ANOMALY_ENGINE, CREDIT_ENGINE, VOICE_AI, REPORT_COPILOT
    action = Column(String(80), nullable=False)
    tool_name = Column(String(80), default="")
    model_or_provider = Column(String(50), default="")
    model_version = Column(String(50), default="")
    result_status = Column(String(30), default="SUCCESS")
    latency_ms = Column(Float, default=15.0)
    details = Column(Text, default="{}")
    created_at = Column(DateTime, default=datetime.utcnow)

class Notification(Base):
    __tablename__ = "notifications"
    
    notification_id = Column(String(50), primary_key=True)
    customer_id = Column(String(50), nullable=False)
    title = Column(String(150), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(30), default="INFO") # SECURITY, CASE, CREDIT, PROMO
    read = Column(Boolean, default=False)
    action_url = Column(String(100), default="")
    created_at = Column(DateTime, default=datetime.utcnow)
