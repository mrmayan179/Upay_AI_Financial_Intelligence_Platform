"""
Pydantic Schemas for Upay Product Backend API
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

# ==============================================================================
# Auth & Profile
# ==============================================================================
class DemoLoginRequest(BaseModel):
    phone_number: str = Field("01771449164", example="01771449164")
    pin: str = Field("1234", example="1234")

class UserProfileResponse(BaseModel):
    customer_id: str
    display_name: str
    phone_masked: str
    raw_phone: str
    account_number: str
    account_balance_bdt: float
    cash_reward_bdt: float
    status: str

# ==============================================================================
# Reports & Cases
# ==============================================================================
class ComplaintClassifyRequest(BaseModel):
    text: str = Field(..., example="Money was deducted but receiver did not receive")

class ComplaintClassifyResponse(BaseModel):
    category: str
    priority: str
    suggested_team: str
    summary: str
    confidence: float
    model_provider: str
    version: str

class CreateReportRequest(BaseModel):
    complaint_text: str = Field(..., example="Payment of 1400 BDT to grocery merchant failed but balance was debited.")
    category: Optional[str] = None
    transaction_id: Optional[str] = None

class CaseEventSchema(BaseModel):
    event_id: str
    case_id: str
    timestamp: str
    event_type: str
    description: str
    actor_type: str
    actor_id: str

class CaseSchema(BaseModel):
    case_id: str
    complaint_id: str
    case_title: str
    category: str
    priority: str
    status: str
    progress_percent: int
    assigned_team: str
    assigned_agent: str
    ai_summary: str
    escalation_level: int
    created_at: str
    updated_at: str
    events: Optional[List[CaseEventSchema]] = None

class EscalateCaseRequest(BaseModel):
    reason: str = Field(..., example="Customer requesting urgent supervisor escalation due to financial hardship")

# ==============================================================================
# Card & Card Transactions
# ==============================================================================
class CardSchema(BaseModel):
    card_id: str
    customer_id: str
    card_type: str
    card_title: str
    card_number_masked: str
    card_number_full: str
    expiry_date: str
    cvv: str
    status: str
    card_enabled: bool
    online_enabled: bool
    international_enabled: bool
    nfc_enabled: bool
    endorsement_usd: float
    used_usd: float
    available_usd: float

class CardSettingsUpdateRequest(BaseModel):
    card_enabled: Optional[bool] = None
    online_enabled: Optional[bool] = None
    international_enabled: Optional[bool] = None
    nfc_enabled: Optional[bool] = None

class CardPinResetRequest(BaseModel):
    current_pin: str
    new_pin: str

class CardTransactionSimulationRequest(BaseModel):
    card_id: str
    amount_usd: float = Field(..., example=45.0)
    merchant_name: str = Field(..., example="Coursera Online")
    channel: str = Field("ONLINE", example="ONLINE") # ONLINE, POS, CONTACTLESS
    country: str = Field("US", example="US")
    is_new_merchant: Optional[int] = 0
    is_new_device: Optional[int] = 0

class CardTransactionResponse(BaseModel):
    transaction_id: str
    card_id: str
    amount_usd: float
    merchant_name: str
    channel: str
    risk_score: int
    risk_level: str
    decision: str
    reasons: List[str]
    status: str
    created_at: str

# ==============================================================================
# Credit Readiness
# ==============================================================================
class CreditReadinessResponse(BaseModel):
    readiness_score: int
    risk_probability: float
    risk_category: str
    suggested_limit_range_bdt: str
    recommendation: str
    disclaimer: str
    positive_factors: List[str]
    negative_factors: List[str]
    review_status: str
    review_requested: bool
    model_version: str

# ==============================================================================
# Voice AI
# ==============================================================================
class VoiceSessionStartRequest(BaseModel):
    phone_number: str = Field("01771449164", example="01771449164")
    lang: Optional[str] = "bn"

class VoiceSessionStartResponse(BaseModel):
    call_id: str
    status: str
    welcome_message: str
    verified: bool

class VoiceVerifyRequest(BaseModel):
    call_id: str
    father_name: Optional[str] = None
    account_suffix: Optional[str] = None
    dob: Optional[str] = None
    voice_pin: Optional[str] = None
    lang: Optional[str] = "bn"

class VoiceVerifyResponse(BaseModel):
    verified: bool
    message: str
    user_id: Optional[str] = None

class VoiceToolCallRequest(BaseModel):
    call_id: str
    tool_name: str = Field(..., example="get_account_summary") # get_account_summary, get_recent_transactions, get_card_status, get_case_status, create_case, escalate_case
    arguments: Optional[Dict[str, Any]] = None

class VoiceToolCallResponse(BaseModel):
    tool_name: str
    result: Dict[str, Any]
    ai_spoken_response: str
    should_escalate: bool

# ==============================================================================
# Audit & Governance
# ==============================================================================
class AIActivityLogSchema(BaseModel):
    ai_log_id: str
    correlation_id: str
    customer_id: Optional[str] = None
    component: str
    action: str
    tool_name: str
    model_or_provider: str
    model_version: str
    result_status: str
    latency_ms: float
    details: Dict[str, Any]
    created_at: str
