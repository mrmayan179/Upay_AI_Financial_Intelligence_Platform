"""
AI Model Inference Adapters for Upay Product Platform
Loads versioned model artifacts from ai_models/ and provides typed inference methods.
"""

from pathlib import Path
from typing import Dict, Any, List, Optional
import joblib
import pandas as pd
import numpy as np

AI_MODELS_DIR = Path(__file__).resolve().parent.parent

_FRAUD_MODEL = None
_ANOMALY_MODEL = None
_CREDIT_MODEL = None

TRANSACTION_TYPE_MAP = {
    "PAYMENT": 0, "SEND_MONEY": 1, "CASH_OUT": 2, "CASH_IN": 3,
    "TRANSFER": 4, "BILL_PAYMENT": 5, "CARD_PAYMENT": 6, "INTERNATIONAL_PAYMENT": 7, "REFUND": 8
}
CHANNEL_MAP = {"APP": 0, "USSD": 1, "QR": 2, "WEB": 3, "POS": 4}
RECIPIENT_TYPE_MAP = {"MERCHANT": 0, "AGENT": 1, "CUSTOMER": 2, "UTILITY_BILLER": 3, "BANK": 4}

FRAUD_COLUMNS = [
    "amount_bdt", "amount_deviation", "is_new_recipient", "is_new_device",
    "is_new_location", "velocity_1h", "velocity_24h", "historical_avg_amount",
    "is_international", "txn_type_code", "channel_code", "recipient_type_code"
]

ANOMALY_COLUMNS = [
    "amount_bdt", "amount_deviation", "velocity_1h", "velocity_24h",
    "historical_avg_amount", "is_new_device", "is_new_location", "is_international", "hour_of_day"
]

CREDIT_COLUMNS = [
    "avg_monthly_inflow", "avg_monthly_outflow", "income_consistency", "balance_stability",
    "cashout_ratio", "transaction_frequency", "account_age_days", "previous_loan_count",
    "previous_repayment_rate", "late_payment_count", "avg_days_late", "outflow_to_inflow_ratio"
]

def get_fraud_model():
    global _FRAUD_MODEL
    if _FRAUD_MODEL is None:
        p = AI_MODELS_DIR / "fraud_xgb.joblib"
        _FRAUD_MODEL = joblib.load(p)
    return _FRAUD_MODEL

def get_anomaly_model():
    global _ANOMALY_MODEL
    if _ANOMALY_MODEL is None:
        p = AI_MODELS_DIR / "anomaly_iforest.joblib"
        _ANOMALY_MODEL = joblib.load(p)
    return _ANOMALY_MODEL

def get_credit_model():
    global _CREDIT_MODEL
    if _CREDIT_MODEL is None:
        p = AI_MODELS_DIR / "credit_xgb.joblib"
        _CREDIT_MODEL = joblib.load(p)
    return _CREDIT_MODEL

def predict_fraud(txn: Dict[str, Any]) -> Dict[str, Any]:
    model = get_fraud_model()
    
    amount = float(txn.get("amount_bdt", 1000.0))
    hist_avg = float(txn.get("historical_avg_amount", 1000.0))
    dev = float(txn.get("amount_deviation", amount / max(1.0, hist_avg)))
    
    row = {
        "amount_bdt": amount,
        "amount_deviation": dev,
        "is_new_recipient": int(txn.get("is_new_recipient", 0)),
        "is_new_device": int(txn.get("is_new_device", 0)),
        "is_new_location": int(txn.get("is_new_location", 0)),
        "velocity_1h": float(txn.get("velocity_1h", 1)),
        "velocity_24h": float(txn.get("velocity_24h", 2)),
        "historical_avg_amount": hist_avg,
        "is_international": int(txn.get("is_international", 0)),
        "txn_type_code": TRANSACTION_TYPE_MAP.get(str(txn.get("transaction_type", "PAYMENT")), 0),
        "channel_code": CHANNEL_MAP.get(str(txn.get("channel", "APP")), 0),
        "recipient_type_code": RECIPIENT_TYPE_MAP.get(str(txn.get("recipient_type", "MERCHANT")), 0)
    }
    
    df = pd.DataFrame([row])[FRAUD_COLUMNS]
    probs = model.predict_proba(df)[:, 1]
    prob = float(probs[0])
    risk_score = int(round(prob * 100))
    
    if risk_score >= 70:
        risk_class = "HIGH"
    elif risk_score >= 40:
        risk_class = "MEDIUM"
    else:
        risk_class = "LOW"
        
    return {
        "fraud_probability": round(prob, 4),
        "risk_score": risk_score,
        "risk_class": risk_class,
        "model_version": "fraud-xgb-1.0.0"
    }

def predict_anomaly(txn: Dict[str, Any]) -> Dict[str, Any]:
    model = get_anomaly_model()
    
    amount = float(txn.get("amount_bdt", 1000.0))
    hist_avg = float(txn.get("historical_avg_amount", 1000.0))
    dev = float(txn.get("amount_deviation", amount / max(1.0, hist_avg)))
    
    row = {
        "amount_bdt": amount,
        "amount_deviation": dev,
        "velocity_1h": float(txn.get("velocity_1h", 1)),
        "velocity_24h": float(txn.get("velocity_24h", 2)),
        "historical_avg_amount": hist_avg,
        "is_new_device": int(txn.get("is_new_device", 0)),
        "is_new_location": int(txn.get("is_new_location", 0)),
        "is_international": int(txn.get("is_international", 0)),
        "hour_of_day": float(txn.get("hour_of_day", 14.0))
    }
    
    df = pd.DataFrame([row])[ANOMALY_COLUMNS]
    raw_score = float(model.decision_function(df)[0])
    norm_score = float(np.clip(0.5 - (raw_score * 2.0), 0.0, 1.0))
    is_anomaly = bool(norm_score >= 0.58 or raw_score < 0)
    
    factors = []
    if dev > 3.0:
        factors.append(f"Spending spike: {dev:.1f}x historical average")
    if row["velocity_1h"] >= 4:
        factors.append(f"Burst velocity: {int(row['velocity_1h'])} txns/hour")
    if row["is_new_device"] == 1:
        factors.append("Unrecognized hardware fingerprint")
    if row["is_new_location"] == 1:
        factors.append("Unusual geographic location")
        
    return {
        "anomaly_score": round(norm_score, 4),
        "raw_decision_score": round(raw_score, 4),
        "anomaly_flag": is_anomaly,
        "deviation_factors": factors,
        "model_version": "anomaly-iforest-1.0.0"
    }

def predict_credit(profile: Dict[str, Any]) -> Dict[str, Any]:
    model = get_credit_model()
    
    inflow = float(profile.get("avg_monthly_inflow", 45000.0))
    outflow = float(profile.get("avg_monthly_outflow", 32000.0))
    
    row = {
        "avg_monthly_inflow": inflow,
        "avg_monthly_outflow": outflow,
        "income_consistency": float(profile.get("income_consistency", 0.85)),
        "balance_stability": float(profile.get("balance_stability", 0.75)),
        "cashout_ratio": float(profile.get("cashout_ratio", 0.30)),
        "transaction_frequency": float(profile.get("transaction_frequency", 25.0)),
        "account_age_days": float(profile.get("account_age_days", 600)),
        "previous_loan_count": float(profile.get("previous_loan_count", 2)),
        "previous_repayment_rate": float(profile.get("previous_repayment_rate", 1.0)),
        "late_payment_count": float(profile.get("late_payment_count", 0)),
        "avg_days_late": float(profile.get("avg_days_late", 0.0)),
        "outflow_to_inflow_ratio": outflow / max(1.0, inflow)
    }
    
    df = pd.DataFrame([row])[CREDIT_COLUMNS]
    probs = model.predict_proba(df)[:, 1]
    risk_prob = float(probs[0])
    readiness_score = int(round((1.0 - risk_prob) * 100))
    readiness_score = max(5, min(98, readiness_score))
    
    if readiness_score >= 70:
        cat = "LOW"
        min_lim = round(inflow * 0.40, -2)
        max_lim = round(inflow * 0.85, -2)
        sug_range = f"BDT {min_lim:,.0f} - BDT {max_lim:,.0f}"
        rec = "RECOMMENDED_FOR_PARTNER_REVIEW"
    elif readiness_score >= 45:
        cat = "MEDIUM"
        min_lim = round(inflow * 0.20, -2)
        max_lim = round(inflow * 0.40, -2)
        sug_range = f"BDT {min_lim:,.0f} - BDT {max_lim:,.0f}"
        rec = "CONDITIONAL_MICRO_CREDIT"
    else:
        cat = "HIGH"
        sug_range = "BDT 0 (Criteria not met)"
        rec = "COACHING_REQUIRED_HIGH_RISK"
        
    return {
        "credit_readiness_score": readiness_score,
        "risk_probability": round(risk_prob, 4),
        "risk_category": cat,
        "suggested_limit_range_bdt": sug_range,
        "recommendation": rec,
        "disclaimer": "Demonstration readiness signal only. Final lending decisions require partner commercial bank underwriting.",
        "model_version": "credit-xgb-1.0.0"
    }

def evaluate_unified_risk_adapter(txn: Dict[str, Any]) -> Dict[str, Any]:
    fraud_res = predict_fraud(txn)
    anom_res = predict_anomaly(txn)
    
    # Deterministic Business Rules
    amount = float(txn.get("amount_bdt", 0.0))
    hist_avg = float(txn.get("historical_avg_amount", 1000.0))
    dev = float(txn.get("amount_deviation", amount / max(1.0, hist_avg)))
    v1h = int(txn.get("velocity_1h", 0))
    new_dev = int(txn.get("is_new_device", 0))
    new_loc = int(txn.get("is_new_location", 0))
    new_recip = int(txn.get("is_new_recipient", 0))
    
    triggered_rules = []
    rule_penalty = 0.0
    hard_block = False
    force_review = False
    force_2fa = False
    
    if v1h >= 6:
        triggered_rules.append("Rapid Velocity Threshold Exceeded (>5 txns/hr)")
        rule_penalty += 35.0
        force_review = True
    if dev >= 8.0 and amount > 20000.0:
        triggered_rules.append(f"Extreme Amount Outlier ({dev:.1f}x baseline)")
        rule_penalty += 35.0
        force_review = True
    if new_dev == 1 and dev >= 2.5:
        triggered_rules.append("Unfamiliar Device Spending Anomaly")
        rule_penalty += 20.0
        force_2fa = True
    if new_dev == 1 and new_loc == 1 and new_recip == 1:
        triggered_rules.append("Account Takeover (ATO) Multi-Vector Threat Pattern")
        rule_penalty += 45.0
        force_review = True
    if amount > 250000.0:
        triggered_rules.append("Central Bank MFS Single Transaction Ceiling Breached")
        hard_block = True
        rule_penalty += 50.0
        
    composite = int(round(
        (fraud_res["fraud_probability"] * 50.0) +
        (anom_res["anomaly_score"] * 30.0) +
        (min(50.0, rule_penalty) * 0.60)
    ))
    
    if force_review and composite < 70:
        composite = max(composite, 72)
    elif force_2fa and composite < 42:
        composite = max(composite, 45)
    composite = max(0, min(100, composite))
    
    if hard_block or composite >= 85:
        decision = "BLOCK"
        risk_level = "CRITICAL"
    elif composite >= 65:
        decision = "HOLD_FOR_REVIEW"
        risk_level = "HIGH"
    elif composite >= 38:
        decision = "CHALLENGE_2FA"
        risk_level = "MEDIUM"
    else:
        decision = "ALLOW"
        risk_level = "LOW"
        
    reasons = []
    if dev > 2.0: reasons.append(f"Amount {dev:.1f}x user's baseline")
    if new_dev == 1: reasons.append("Unrecognized device fingerprint")
    if new_recip == 1: reasons.append("First-time recipient transfer")
    if new_loc == 1: reasons.append("Unfamiliar transaction location")
    if v1h >= 4: reasons.append(f"Burst velocity ({v1h} txns in 1 hour)")
    for r in triggered_rules:
        if r not in reasons: reasons.append(r)
        
    return {
        "decision": decision,
        "risk_level": risk_level,
        "composite_risk_score": composite,
        "fraud_output": fraud_res,
        "anomaly_output": anom_res,
        "triggered_rules": triggered_rules,
        "reasons": reasons[:4] if reasons else ["Normal historical spending pattern"]
    }
