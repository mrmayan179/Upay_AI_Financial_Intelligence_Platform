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

def _score_to_level(score: int) -> str:
    if score >= 80:
        return "CRITICAL"
    elif score >= 60:
        return "HIGH"
    elif score >= 35:
        return "MEDIUM"
    return "LOW"

def evaluate_granular_risk_breakdown(txn: Dict[str, Any]) -> Dict[str, Any]:
    """
    Computes an explicit multi-dimensional risk breakdown across all required dimensions:
    - Fraud Risk (XGBoost ML)
    - Behavioral Anomaly Risk (Isolation Forest ML)
    - Amount Risk (Deviation Signal)
    - Velocity Risk (Frequency Signal)
    - Device Risk (Hardware Fingerprint Signal)
    - Location Risk (Geolocation Signal)
    - Recipient Risk (Counterparty Novelty)
    - Merchant Risk (Category & Channel Rules)
    - Account-Takeover / Security Risk (Multi-Vector Defense Rules)
    """
    fraud_res = predict_fraud(txn)
    anom_res = predict_anomaly(txn)
    
    amount = float(txn.get("amount_bdt", 0.0))
    hist_avg = float(txn.get("historical_avg_amount", 1000.0))
    dev = float(txn.get("amount_deviation", amount / max(1.0, hist_avg)))
    v1h = int(txn.get("velocity_1h", 0))
    v24h = int(txn.get("velocity_24h", 0))
    new_dev = int(txn.get("is_new_device", 0))
    new_loc = int(txn.get("is_new_location", 0))
    new_recip = int(txn.get("is_new_recipient", 0))
    is_intl = int(txn.get("is_international", 0))
    channel = str(txn.get("channel", "APP")).upper()
    merchant_name = str(txn.get("merchant_name", "General Merchant"))
    
    # 1. Dimension: Fraud Risk (ML)
    fraud_score = int(round(fraud_res["fraud_probability"] * 100))
    fraud_level = _score_to_level(fraud_score)
    fraud_reason = f"XGBoost probability {fraud_res['fraud_probability']:.2f} based on aggregate features"
    
    # 2. Dimension: Behavioral Anomaly Risk (ML)
    anom_score = int(round(anom_res["anomaly_score"] * 100))
    anom_level = _score_to_level(anom_score)
    anom_reason = "; ".join(anom_res["deviation_factors"]) if anom_res["deviation_factors"] else "Behavioral spending pattern normal"
    
    # 3. Dimension: Amount Risk
    if dev <= 1.5:
        amount_score = 12
        amount_reason = f"Amount is within normal range ({dev:.1f}x baseline)"
    elif dev <= 3.0:
        amount_score = 42
        amount_reason = f"Moderate amount deviation ({dev:.1f}x baseline)"
    elif dev <= 6.0:
        amount_score = 72
        amount_reason = f"Significant spending spike ({dev:.1f}x baseline)"
    else:
        amount_score = min(98, int(round(72 + (dev - 6.0) * 4)))
        amount_reason = f"Extreme amount outlier ({dev:.1f}x historical average)"
    amount_level = _score_to_level(amount_score)
    
    # 4. Dimension: Velocity Risk
    if v1h <= 1 and v24h <= 4:
        velocity_score = 10
        velocity_reason = f"Standard transaction velocity ({v1h}/hr, {v24h}/24hr)"
    elif v1h == 2 or v24h <= 8:
        velocity_score = 36
        velocity_reason = f"Elevated frequency ({v1h} in past hour)"
    elif v1h in (3, 4) or v24h <= 15:
        velocity_score = 68
        velocity_reason = f"Burst velocity spike ({v1h} txns in 1hr)"
    else:
        velocity_score = min(98, 76 + (v1h - 4) * 5)
        velocity_reason = f"Critical burst velocity ({v1h} txns in 1hr, {v24h} in 24hr)"
    velocity_level = _score_to_level(velocity_score)
    
    # 5. Dimension: Device Risk
    if new_dev == 0:
        device_score = 10
        device_reason = "Recognized hardware fingerprint"
    else:
        device_score = 72
        device_reason = "Unrecognized / First-time hardware device fingerprint"
    device_level = _score_to_level(device_score)
    
    # 6. Dimension: Location Risk
    if new_loc == 0 and is_intl == 0:
        location_score = 10
        location_reason = "Habitual domestic jurisdiction"
    elif new_loc == 1 and is_intl == 0:
        location_score = 55
        location_reason = "New geographic domestic region"
    else:
        location_score = 72
        location_reason = f"Cross-border international transaction ({txn.get('country', 'Foreign')})"
    location_level = _score_to_level(location_score)
    
    # 7. Dimension: Recipient Risk
    if new_recip == 0:
        recipient_score = 12
        recipient_reason = "Established transaction counterparty"
    else:
        recipient_score = 64
        recipient_reason = "First-time transfer to unfamiliar counterparty"
    recipient_level = _score_to_level(recipient_score)
    
    # 8. Dimension: Merchant Risk
    m_lower = merchant_name.lower()
    if any(k in m_lower for k in ["unknown", "crypto", "casino", "wire", "lagos", "betting"]):
        merchant_score = 82
        merchant_reason = "High-risk merchant profile or unverified terminal"
    elif channel == "ONLINE" and is_intl == 1:
        merchant_score = 45
        merchant_reason = "Foreign online e-commerce merchant"
    else:
        merchant_score = 15
        merchant_reason = "Verified merchant channel"
    merchant_level = _score_to_level(merchant_score)
    
    # 9. Dimension: Account-Takeover / Security Rule Layer
    triggered_rules = []
    ato_score = 10
    ato_reason = "No account takeover signatures identified"
    hard_block = False
    
    if new_dev == 1 and new_loc == 1 and new_recip == 1:
        ato_score = 92
        ato_reason = "ATO Multi-Vector Threat: New device + new location + new recipient"
        triggered_rules.append("Account Takeover (ATO) Multi-Vector Threat Pattern")
    elif new_dev == 1 and dev >= 3.0:
        ato_score = 80
        ato_reason = "New hardware device paired with extreme amount deviation"
        triggered_rules.append("Unfamiliar Device Spending Anomaly")
    elif v1h >= 5:
        ato_score = 75
        ato_reason = f"Automated bot or rapid credential stuffing pattern ({v1h} txns/hr)"
        triggered_rules.append("Rapid Velocity Threshold Exceeded (>4 txns/hr)")
        
    if amount > 250000.0:
        triggered_rules.append("Central Bank MFS Single Transaction Ceiling Breached (BDT 250,000)")
        hard_block = True
        
    ato_level = _score_to_level(ato_score)
    
    # Composite Risk Calculation (Weighted Policy)
    composite = int(round(
        0.30 * fraud_score +
        0.20 * anom_score +
        0.15 * amount_score +
        0.12 * velocity_score +
        0.08 * device_score +
        0.05 * location_score +
        0.05 * recipient_score +
        0.05 * merchant_score
    ))
    
    # Rule floors
    if ato_score >= 80:
        composite = max(composite, ato_score)
    if hard_block:
        composite = 100
        
    composite = max(0, min(100, composite))
    risk_level = _score_to_level(composite)
    
    # Governance Decision & Recommended Action
    if hard_block or composite >= 82:
        decision = "BLOCK"
        recommended_action = "Decline authorization and flag for immediate security review."
    elif composite >= 62:
        decision = "HOLD_FOR_REVIEW"
        recommended_action = "Hold transaction in supervisory queue pending customer confirmation."
    elif composite >= 35:
        decision = "CHALLENGE_2FA"
        recommended_action = "Require secondary biometric or OTP challenge before processing."
    else:
        decision = "ALLOW"
        recommended_action = "Authorize transaction through automated straight-through processing."
        
    # Primary Human-Readable Reasons
    reasons = []
    if dev > 2.0:
        reasons.append(f"Amount is {dev:.1f}x customer historical average (BDT {amount:,.0f} vs BDT {hist_avg:,.0f})")
    if new_dev == 1:
        reasons.append("Unrecognized hardware device fingerprint")
    if new_recip == 1:
        reasons.append(f"First-time transfer to merchant '{merchant_name}'")
    if v1h >= 2:
        reasons.append(f"High velocity: {v1h} transactions in the last hour")
    if is_intl == 1:
        reasons.append(f"International foreign transaction ({txn.get('country', 'US')})")
    for r in triggered_rules:
        if r not in reasons:
            reasons.append(r)
    if not reasons:
        reasons = ["Transaction aligns with habitual spending behavior and verified device"]
        
    # Proactive Predictive User Warning Experience (Phase D)
    should_warn = (composite >= 35) or (amount_level in ["HIGH", "CRITICAL"]) or (new_dev == 1 and new_recip == 1)
    
    warning_points = []
    if dev >= 2.5:
        warning_points.append(f"Amount is {dev:.1f}× higher than your usual average (BDT {hist_avg:,.0f})")
    if new_recip == 1:
        warning_points.append(f"You haven't transacted with '{merchant_name}' before")
    if new_dev == 1:
        warning_points.append("This device hasn't been used for previous transactions")
    if v1h >= 3:
        warning_points.append(f"Multiple transactions ({v1h}) sent in the past hour")
    if is_intl == 1:
        warning_points.append("International merchant payment with foreign exchange quota deduction")
        
    if should_warn:
        severity = "HIGH_RISK" if composite >= 65 else "CAUTION"
        proactive_warning = {
            "should_warn": True,
            "is_warning_active": True,
            "severity": severity,
            "headline": "This transaction looks unusual" if severity == "HIGH_RISK" else "Please review transaction details",
            "title": "This transaction looks unusual" if severity == "HIGH_RISK" else "Please review transaction details",
            "subtitle": f"Amount is {dev:.1f}x your recent average" if dev > 2.0 else "Unusual activity factors detected",
            "headline_bn": "লেনদেনটি আপনার স্বাভাবিক খরচের তুলনায় ব্যতিক্রমী" if severity == "HIGH_RISK" else "দয়া করে লেনদেনের বিবরণ পুনরায় যাচাই করুন",
            "message": "Our AI safety engine noticed deviations from your typical activity. We want to help you prevent mistakes.",
            "message_bn": "আপনার পূর্ববর্তী লেনদেনের তুলনায় কিছু অমিল পাওয়া গেছে। আপনার নিরাপত্তা নিশ্চিত করতেই এই তথ্য প্রদর্শন করা হচ্ছে।",
            "warning_reasons": warning_points if warning_points else reasons[:3],
            "reasons": warning_points if warning_points else reasons[:3],
            "recommended_action": "Verify the merchant name and amount before continuing." if severity != "HIGH_RISK" else "Carefully check if you authorized this payment before proceeding.",
            "recommended_action_bn": "সম্মতি দেওয়ার আগে মার্চেন্টের নাম এবং টাকার পরিমাণ ভালোভাবে যাচাই করে নিন।",
            "allowed_user_actions": ["CONTINUE_WITH_PIN", "CANCEL"] if composite < 80 else ["HOLD_FOR_REVIEW", "CANCEL"],
            "disclaimer": "This is a predictive risk advisory to help protect your account. No absolute claim of loss is made."
        }
    else:
        proactive_warning = {
            "should_warn": False,
            "is_warning_active": False,
            "severity": "NORMAL",
            "headline": "Transaction looks standard",
            "title": "Transaction looks standard",
            "subtitle": "Transaction aligns with normal spending behavior",
            "headline_bn": "লেনদেনটি স্বাভাবিক সীমার মধ্যে রয়েছে",
            "message": "Activity matches your verified historical pattern.",
            "message_bn": "লেনদেনের ধারা আপনার স্বাভাবিক খরচের সাথে সঙ্গতিপূর্ণ।",
            "warning_reasons": ["Normal spending behavior"],
            "reasons": ["Normal spending behavior"],
            "recommended_action": "Proceed with regular PIN authentication.",
            "recommended_action_bn": "নিয়মিত পিন দিয়ে লেনদেন সম্পন্ন করুন।",
            "allowed_user_actions": ["CONTINUE_WITH_PIN", "CANCEL"],
            "disclaimer": "Standard automated transaction verification."
        }
        
    risk_breakdown = {
        "fraud": {
            "score": fraud_score,
            "level": fraud_level,
            "reason": fraud_reason,
            "source": "ML: XGBoost Classifier (fraud-xgb-1.0.0)"
        },
        "anomaly": {
            "score": anom_score,
            "level": anom_level,
            "reason": anom_reason,
            "source": "ML: Isolation Forest (anomaly-iforest-1.0.0)"
        },
        "amount": {
            "score": amount_score,
            "level": amount_level,
            "reason": amount_reason,
            "source": "Derived: Spending Baseline Deviation"
        },
        "velocity": {
            "score": velocity_score,
            "level": velocity_level,
            "reason": velocity_reason,
            "source": "Derived: 1h & 24h Frequency Velocity"
        },
        "device": {
            "score": device_score,
            "level": device_level,
            "reason": device_reason,
            "source": "Signal: Hardware Identity Verification"
        },
        "location": {
            "score": location_score,
            "level": location_level,
            "reason": location_reason,
            "source": "Signal: Geolocation Consistency"
        },
        "recipient": {
            "score": recipient_score,
            "level": recipient_level,
            "reason": recipient_reason,
            "source": "Signal: Counterparty Novelty"
        },
        "merchant": {
            "score": merchant_score,
            "level": merchant_level,
            "reason": merchant_reason,
            "source": "Rule: Merchant Risk Profiling"
        },
        "security_ato": {
            "score": ato_score,
            "level": ato_level,
            "reason": ato_reason,
            "source": "Rule: Multi-Vector Account Takeover Guard"
        }
    }
    
    return {
        "decision": decision,
        "risk_level": risk_level,
        "final_level": risk_level,
        "composite_risk_score": composite,
        "composite_score": composite,
        "risk": risk_breakdown,
        "recommended_action": recommended_action,
        "proactive_warning": proactive_warning,
        "triggered_rules": triggered_rules,
        "reasons": reasons[:4] if reasons else ["Normal historical spending pattern"],
        "fraud_output": fraud_res,
        "anomaly_output": anom_res,
        "model_version": "fraud-xgb-1.0.0+anomaly-iforest-1.0.0"
    }

def evaluate_unified_risk_adapter(txn: Dict[str, Any]) -> Dict[str, Any]:
    """Compatibility bridge calling the full granular risk breakdown engine."""
    return evaluate_granular_risk_breakdown(txn)

