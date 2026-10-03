"""
Unified Risk Engine — Combines Fraud XGBoost, Behavioral Isolation Forest, and Business Rule Engine
Implements strict separation of deterministic business logic from statistical ML.
"""

from typing import Dict, Any
from ml.fraud.predict import predict_fraud
from ml.anomaly.predict import predict_anomaly
from ml.fraud.explain import explain_transaction

def evaluate_business_rules(transaction: Dict[str, Any]) -> Dict[str, Any]:
    """
    Deterministic rule engine checking regulatory and security boundaries.
    Completely decoupled from ML inference.
    """
    triggered_rules = []
    rule_penalty = 0.0
    hard_block = False
    force_review = False
    force_2fa = False
    
    amount = float(transaction.get("amount_bdt", 0.0))
    hist_avg = float(transaction.get("historical_avg_amount", 1000.0))
    dev = float(transaction.get("amount_deviation", amount / max(1.0, hist_avg)))
    v1h = int(transaction.get("velocity_1h", 0))
    new_dev = int(transaction.get("is_new_device", 0))
    new_loc = int(transaction.get("is_new_location", 0))
    new_recip = int(transaction.get("is_new_recipient", 0))
    is_intl = int(transaction.get("is_international", 0))
    
    # Rule 1: High velocity burst
    if v1h >= 6:
        triggered_rules.append({
            "rule_id": "RULE-VEL-01",
            "rule_name": "Rapid Velocity Threshold Exceeded",
            "description": f"Customer initiated {v1h} transactions within 1 hour (Limit: 5/hr)",
            "severity": "HIGH"
        })
        rule_penalty += 35.0
        force_review = True
        
    # Rule 2: Extreme single ticket deviation
    if dev >= 8.0 and amount > 20000.0:
        triggered_rules.append({
            "rule_id": "RULE-DEV-02",
            "rule_name": "Extreme Amount Outlier",
            "description": f"Transaction amount is {dev:.1f}x higher than 30-day baseline average",
            "severity": "HIGH"
        })
        rule_penalty += 35.0
        force_review = True
        
    # Rule 3: Unrecognized device with noticeable deviation
    if new_dev == 1 and dev >= 2.5:
        triggered_rules.append({
            "rule_id": "RULE-DEV-03",
            "rule_name": "New Device Spending Anomaly",
            "description": "Unregistered device attempting higher than usual spending",
            "severity": "MEDIUM"
        })
        rule_penalty += 20.0
        force_2fa = True
        
    # Rule 4: Trifecta identity anomaly (New Device + New Location + New Recipient)
    if new_dev == 1 and new_loc == 1 and new_recip == 1:
        triggered_rules.append({
            "rule_id": "RULE-ATO-04",
            "rule_name": "Account Takeover (ATO) Threat Pattern",
            "description": "Simultaneous new device, unfamiliar geographic district, and unverified counterparty",
            "severity": "CRITICAL"
        })
        rule_penalty += 45.0
        force_review = True
        
    # Rule 5: Regulatory transaction ceiling
    if amount > 250000.0:
        triggered_rules.append({
            "rule_id": "RULE-REG-05",
            "rule_name": "Central Bank MFS Single Transaction Ceiling",
            "description": "Single transaction amount exceeds maximum permissible BDT 250,000 threshold",
            "severity": "BLOCK"
        })
        hard_block = True
        rule_penalty += 50.0
        
    return {
        "triggered_rules": triggered_rules,
        "rule_count": len(triggered_rules),
        "rule_penalty": min(50.0, rule_penalty),
        "hard_block": hard_block,
        "force_review": force_review,
        "force_2fa": force_2fa
    }

def evaluate_unified_risk(transaction: Dict[str, Any]) -> Dict[str, Any]:
    """
    Unified multi-layered risk evaluation:
    1. Statistical Fraud Probability (XGBoost)
    2. Unsupervised Behavioral Anomaly Score (Isolation Forest)
    3. Deterministic Business & Regulatory Rules
    4. SHAP feature attribution explanation
    """
    # 1. Model 1 — Fraud XGBoost
    fraud_res = predict_fraud(transaction)
    fraud_prob = fraud_res["fraud_probability"]
    
    # 2. Model 2 — Isolation Forest
    anomaly_res = predict_anomaly(transaction)
    anomaly_score = anomaly_res["anomaly_score"]
    
    # 3. Rule Engine
    rule_res = evaluate_business_rules(transaction)
    
    # 4. Composite Risk Aggregation
    # Base calculation combining ML and rule signals
    composite_score = int(round(
        (fraud_prob * 50.0) +
        (anomaly_score * 30.0) +
        (rule_res["rule_penalty"] * 0.60)
    ))
    
    if rule_res["force_review"] and composite_score < 70:
        composite_score = max(composite_score, 72)
    elif rule_res["force_2fa"] and composite_score < 42:
        composite_score = max(composite_score, 45)
        
    composite_score = max(0, min(100, composite_score))
    
    # Determine Action Recommendation
    if rule_res["hard_block"] or composite_score >= 85:
        decision = "BLOCK"
        risk_level = "CRITICAL"
    elif composite_score >= 65:
        decision = "HOLD_FOR_REVIEW"
        risk_level = "HIGH"
    elif composite_score >= 38:
        decision = "CHALLENGE_2FA"
        risk_level = "MEDIUM"
    else:
        decision = "ALLOW"
        risk_level = "LOW"
        
    # 5. XAI Explainability
    xai_res = explain_transaction(transaction, top_k=3)
    
    # Combine reasons from ML and rules
    combined_reasons = list(xai_res["top_risk_reasons"])
    for r in rule_res["triggered_rules"]:
        rule_label = f"Rule: {r['rule_name']}"
        if rule_label not in combined_reasons:
            combined_reasons.append(rule_label)
            
    return {
        "decision": decision,
        "risk_level": risk_level,
        "composite_risk_score": composite_score,
        "fraud_model_output": {
            "fraud_probability": fraud_prob,
            "risk_score": fraud_res["risk_score"],
            "risk_class": fraud_res["risk_class"],
            "model_version": fraud_res["model_version"]
        },
        "anomaly_model_output": {
            "anomaly_score": anomaly_score,
            "anomaly_flag": anomaly_res["anomaly_flag"],
            "deviation_factors": anomaly_res["deviation_factors"],
            "model_version": anomaly_res["model_version"]
        },
        "rule_engine_output": {
            "triggered_rules": rule_res["triggered_rules"],
            "rule_count": rule_res["rule_count"],
            "hard_block": rule_res["hard_block"]
        },
        "explainability": {
            "top_reasons": combined_reasons[:4],
            "risk_factors": xai_res["risk_increasing_factors"],
            "protective_factors": xai_res["protective_factors"]
        }
    }
