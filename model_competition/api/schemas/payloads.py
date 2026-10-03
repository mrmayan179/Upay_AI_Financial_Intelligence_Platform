"""
Pydantic Request & Response Schemas for Upay AI API
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

# ==============================================================================
# Transaction Risk & Fraud Schemas
# ==============================================================================
class TransactionAnalyzeRequest(BaseModel):
    amount_bdt: float = Field(..., example=4500.0, description="Transaction amount in BDT")
    historical_avg_amount: float = Field(..., example=1200.0, description="Customer 30-day baseline average spend")
    amount_deviation: Optional[float] = Field(None, example=3.75, description="Ratio of amount to historical average")
    is_new_recipient: int = Field(0, example=1, ge=0, le=1, description="1 if counterparty recipient is first-time")
    is_new_device: int = Field(0, example=0, ge=0, le=1, description="1 if device fingerprint is unverified")
    is_new_location: int = Field(0, example=0, ge=0, le=1, description="1 if geolocation is outside usual district")
    velocity_1h: int = Field(1, example=2, ge=0, description="Transactions initiated within past 1 hour")
    velocity_24h: int = Field(2, example=4, ge=0, description="Transactions initiated within past 24 hours")
    is_international: int = Field(0, example=0, ge=0, le=1, description="1 if cross-border transaction")
    transaction_type: str = Field("PAYMENT", example="PAYMENT", description="Operation type")
    channel: str = Field("APP", example="APP", description="Access channel")
    recipient_type: str = Field("MERCHANT", example="MERCHANT", description="Counterparty category")
    hour_of_day: Optional[float] = Field(14.0, example=14.0, description="Hour of day (0-23)")

class FraudAnalyzeResponse(BaseModel):
    fraud_probability: float
    risk_score: int
    risk_class: str
    model_version: str

class AnomalyAnalyzeResponse(BaseModel):
    anomaly_score: float
    raw_decision_score: float
    anomaly_flag: bool
    deviation_factors: List[str]
    model_version: str

class UnifiedRiskResponse(BaseModel):
    decision: str
    risk_level: str
    composite_risk_score: int
    fraud_model_output: Dict[str, Any]
    anomaly_model_output: Dict[str, Any]
    rule_engine_output: Dict[str, Any]
    explainability: Dict[str, Any]

# ==============================================================================
# Credit Readiness Schemas
# ==============================================================================
class CreditAnalyzeRequest(BaseModel):
    avg_monthly_inflow: float = Field(..., example=65000.0, description="Average monthly inward credits in BDT")
    avg_monthly_outflow: float = Field(..., example=42000.0, description="Average monthly outward debits in BDT")
    income_consistency: float = Field(..., example=0.88, ge=0.0, le=1.0, description="Stability ratio of periodic income")
    balance_stability: float = Field(..., example=0.74, ge=0.0, le=1.0, description="Ratio of minimum retained balance")
    cashout_ratio: float = Field(..., example=0.32, ge=0.0, le=1.0, description="Cash-out volume / Total outflow")
    transaction_frequency: float = Field(..., example=28.0, ge=0.0, description="Average transactions per month")
    account_age_days: int = Field(..., example=650, ge=0, description="Tenure of account in days")
    previous_loan_count: int = Field(2, example=2, ge=0, description="Prior loans availed")
    previous_repayment_rate: float = Field(1.0, example=1.0, ge=0.0, le=1.0, description="Percentage of installments on-time")
    late_payment_count: int = Field(0, example=0, ge=0, description="Past overdue count")
    avg_days_late: float = Field(0.0, example=0.0, ge=0.0, description="Average delay in days")

class CreditAnalyzeResponse(BaseModel):
    credit_readiness_score: int
    risk_probability: float
    risk_category: str
    suggested_limit_range_bdt: str
    recommendation: str
    disclaimer: str
    model_version: str

# ==============================================================================
# Explainability Schemas
# ==============================================================================
class ExplainTransactionRequest(BaseModel):
    transaction: TransactionAnalyzeRequest
    top_k: int = Field(4, ge=1, le=10)

class ExplainCreditRequest(BaseModel):
    credit_profile: CreditAnalyzeRequest
    top_k: int = Field(3, ge=1, le=10)
