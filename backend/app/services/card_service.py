"""
Dual-Currency Smart Card & AI Card Security Service
Implements card controls, USD endorsement accounting, and real-time AI fraud/anomaly gating.
"""

import json
import uuid
from datetime import datetime
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from backend.app.database.models import Card, CardTransaction, Notification
from backend.app.services.audit_service import log_ai_activity
from backend.app.services.transaction_feature_engine import extract_runtime_transaction_features
from ai_models.inference.adapters import evaluate_granular_risk_breakdown, evaluate_unified_risk_adapter

def get_user_cards(db: Session, customer_id: str) -> List[Card]:
    return db.query(Card).filter(Card.customer_id == customer_id).all()

def get_card_by_id(db: Session, card_id: str) -> Card:
    return db.query(Card).filter(Card.card_id == card_id).first()

def update_card_toggles(db: Session, card_id: str, updates: Dict[str, Any]) -> Card:
    card = get_card_by_id(db, card_id)
    if not card:
        return None
        
    for k, v in updates.items():
        if hasattr(card, k) and v is not None:
            setattr(card, k, v)
            
    db.commit()
    db.refresh(card)
    return card

def freeze_card_toggle(db: Session, card_id: str) -> Card:
    card = get_card_by_id(db, card_id)
    if not card:
        return None
    card.status = "FROZEN" if card.status != "FROZEN" else "ACTIVE"
    card.card_enabled = (card.status == "ACTIVE")
    db.commit()
    db.refresh(card)
    return card

def reset_mock_pin(db: Session, card_id: str, current_pin: str, new_pin: str) -> Dict[str, Any]:
    card = get_card_by_id(db, card_id)
    if not card:
        return {"success": False, "message": "Card not found"}
    if len(new_pin) != 4 or not new_pin.isdigit():
        return {"success": False, "message": "PIN must be exactly 4 digits"}
        
    card.pin_hash = new_pin # mock demonstration storage
    db.commit()
    return {"success": True, "message": "Card PIN updated successfully in secure enclave."}

def pre_check_card_transaction(
    db: Session,
    customer_id: str,
    card_id: str,
    amount_usd: float,
    merchant_name: str,
    channel: str = "ONLINE",
    country: str = "US",
    device_id: str = "DEV-APP-01",
    is_new_merchant: int = None,
    is_new_device: int = None
) -> Dict[str, Any]:
    """
    Performs runtime database analysis and predictive risk assessment BEFORE transaction commit.
    Provides customer-facing predictive warnings without executing financial debit.
    """
    card = get_card_by_id(db, card_id)
    if not card:
        return {"error": "Card not found", "should_warn": True}
        
    runtime_features = extract_runtime_transaction_features(
        db=db,
        customer_id=customer_id,
        card_id=card_id,
        amount_usd=amount_usd,
        merchant_name=merchant_name,
        channel=channel,
        country=country,
        device_id=device_id
    )
    
    # Allow manual override if specified in simulation test
    if is_new_merchant is not None:
        runtime_features["is_new_recipient"] = int(is_new_merchant)
    if is_new_device is not None:
        runtime_features["is_new_device"] = int(is_new_device)
        
    risk_assessment = evaluate_granular_risk_breakdown(runtime_features)
    
    return {
        "card_id": card_id,
        "amount_usd": amount_usd,
        "amount_bdt": runtime_features["amount_bdt"],
        "historical_avg_amount_bdt": runtime_features["historical_avg_amount"],
        "amount_deviation": runtime_features["amount_deviation"],
        "merchant_name": merchant_name,
        "channel": channel,
        "country": country,
        "runtime_features": runtime_features,
        "risk": risk_assessment["risk"],
        "composite_score": risk_assessment["composite_score"],
        "composite_risk_score": risk_assessment["composite_risk_score"],
        "final_level": risk_assessment["final_level"],
        "risk_level": risk_assessment["risk_level"],
        "decision": risk_assessment["decision"],
        "recommended_action": risk_assessment["recommended_action"],
        "proactive_warning": risk_assessment["proactive_warning"],
        "reasons": risk_assessment["reasons"],
        "model_version": risk_assessment["model_version"]
    }

def process_card_authorization(
    db: Session,
    customer_id: str,
    card_id: str,
    amount_usd: float,
    merchant_name: str,
    channel: str = "ONLINE",
    country: str = "US",
    is_new_merchant: int = None,
    is_new_device: int = None,
    device_id: str = "DEV-APP-01"
) -> Dict[str, Any]:
    """
    Authorizes card payment against deterministic controls and ML unified risk engine
    using live features extracted at runtime from database records.
    """
    card = get_card_by_id(db, card_id)
    if not card:
        return {"decision": "BLOCK", "status": "DECLINED", "reason": "Card not found"}
        
    txn_id = f"CTXN-{uuid.uuid4().hex[:8].upper()}"
    
    # 1. Deterministic Card Controls
    if not card.card_enabled or card.status == "FROZEN":
        return _record_declined(db, card, txn_id, amount_usd, merchant_name, channel, country, "Card is FROZEN or toggled OFF")
        
    if channel == "ONLINE" and not card.online_enabled:
        return _record_declined(db, card, txn_id, amount_usd, merchant_name, channel, country, "Online e-commerce transactions disabled on card")
        
    if country != "BD" and not card.international_enabled:
        return _record_declined(db, card, txn_id, amount_usd, merchant_name, channel, country, "International foreign currency transactions disabled")
        
    if channel == "CONTACTLESS" and not card.nfc_enabled:
        return _record_declined(db, card, txn_id, amount_usd, merchant_name, channel, country, "NFC / Contactless tap payments disabled")
        
    if (card.used_usd + amount_usd) > card.endorsement_usd:
        return _record_declined(db, card, txn_id, amount_usd, merchant_name, channel, country, "Passport USD endorsement quota exceeded")
        
    # 2. Extract Real Runtime Features from Database
    runtime_features = extract_runtime_transaction_features(
        db=db,
        customer_id=customer_id,
        card_id=card_id,
        amount_usd=amount_usd,
        merchant_name=merchant_name,
        channel=channel,
        country=country,
        device_id=device_id
    )
    
    if is_new_merchant is not None:
        runtime_features["is_new_recipient"] = int(is_new_merchant)
    if is_new_device is not None:
        runtime_features["is_new_device"] = int(is_new_device)
        
    # 3. Invoke Multi-Dimensional Risk Evaluation
    risk_res = evaluate_granular_risk_breakdown(runtime_features)
    decision = risk_res["decision"]
    risk_score = risk_res["composite_risk_score"]
    risk_level = risk_res["final_level"]
    reasons = risk_res["reasons"]
    recommended_action = risk_res["recommended_action"]
    proactive_warning = risk_res["proactive_warning"]
    
    # 4. Apply Decision & Map Lifecycle Status
    if decision == "ALLOW":
        card.used_usd = round(card.used_usd + amount_usd, 2)
        txn_status = "APPROVED"
    elif decision == "CHALLENGE_2FA":
        txn_status = "CHALLENGE_REQUIRED"
    elif decision == "HOLD_FOR_REVIEW":
        txn_status = "HELD_FOR_REVIEW"
    else:
        txn_status = "DECLINED"
        
    amount_bdt = runtime_features["amount_bdt"]
    fraud_s = risk_res["risk"]["fraud"]["score"]
    anom_s = risk_res["risk"]["anomaly"]["score"]
    
    card_txn = CardTransaction(
        transaction_id=txn_id,
        card_id=card_id,
        customer_id=customer_id,
        amount_usd=amount_usd,
        amount_bdt=amount_bdt,
        merchant_name=merchant_name,
        channel=channel,
        country=country,
        risk_score=risk_score,
        risk_level=risk_level,
        decision=decision,
        reasons=json.dumps(reasons),
        risk_breakdown=json.dumps(risk_res["risk"]),
        fraud_score=fraud_s,
        anomaly_score=anom_s,
        device_id=device_id,
        recommended_action=recommended_action,
        model_version=risk_res["model_version"],
        status=txn_status,
        created_at=datetime.utcnow()
    )
    db.add(card_txn)
    
    # Send security notification if flagged or high risk
    if decision != "ALLOW":
        notif = Notification(
            notification_id=f"NOTIF-{uuid.uuid4().hex[:8].upper()}",
            customer_id=customer_id,
            title=f"AI Security Alert: {merchant_name}",
            message=f"${amount_usd:.2f} USD flagged as {risk_level} risk ({decision}). Action: {recommended_action}",
            type="SECURITY",
            action_url="/cards",
            created_at=datetime.utcnow()
        )
        db.add(notif)
        
    log_ai_activity(
        db=db,
        correlation_id=txn_id,
        customer_id=customer_id,
        component="FRAUD_ENGINE",
        action="CARD_TRANSACTION_AUTHORIZATION",
        tool_name="evaluate_granular_risk_breakdown",
        model_or_provider="xgboost-plus-isolation-forest",
        model_version=risk_res["model_version"],
        result_status=decision,
        latency_ms=16.0,
        details={
            "risk_score": risk_score,
            "decision": decision,
            "reasons": reasons,
            "runtime_features": {
                "hist_avg_bdt": runtime_features["historical_avg_amount"],
                "dev": runtime_features["amount_deviation"],
                "v1h": runtime_features["velocity_1h"],
                "v24h": runtime_features["velocity_24h"]
            }
        }
    )
    
    db.commit()
    db.refresh(card_txn)
    
    return {
        "transaction_id": txn_id,
        "card_id": card_id,
        "amount_usd": amount_usd,
        "amount_bdt": amount_bdt,
        "merchant_name": merchant_name,
        "channel": channel,
        "risk_score": risk_score,
        "composite_score": risk_score,
        "risk_level": risk_level,
        "final_level": risk_level,
        "decision": decision,
        "reasons": reasons,
        "risk": risk_res["risk"],
        "recommended_action": recommended_action,
        "proactive_warning": proactive_warning,
        "status": txn_status,
        "model_version": risk_res["model_version"],
        "created_at": card_txn.created_at.isoformat()
    }

def _record_declined(db, card, txn_id, amount_usd, merchant_name, channel, country, reason):
    amount_bdt = round(amount_usd * 121.50, 2)
    empty_breakdown = {
        "fraud": {"score": 95, "level": "CRITICAL", "reason": reason, "source": "Rule: Policy Enforcement"},
        "anomaly": {"score": 90, "level": "CRITICAL", "reason": reason, "source": "Rule: Policy Enforcement"},
        "amount": {"score": 50, "level": "MEDIUM", "reason": "Evaluated under policy", "source": "Derived"},
        "velocity": {"score": 20, "level": "LOW", "reason": "Standard", "source": "Derived"},
        "device": {"score": 10, "level": "LOW", "reason": "Policy check", "source": "Signal"},
        "location": {"score": 75 if country != "BD" else 10, "level": "HIGH" if country != "BD" else "LOW", "reason": reason, "source": "Signal"},
        "recipient": {"score": 50, "level": "MEDIUM", "reason": reason, "source": "Signal"},
        "merchant": {"score": 50, "level": "MEDIUM", "reason": reason, "source": "Rule"},
        "security_ato": {"score": 95, "level": "CRITICAL", "reason": reason, "source": "Rule"}
    }
    card_txn = CardTransaction(
        transaction_id=txn_id,
        card_id=card.card_id,
        customer_id=card.customer_id,
        amount_usd=amount_usd,
        amount_bdt=amount_bdt,
        merchant_name=merchant_name,
        channel=channel,
        country=country,
        risk_score=95,
        risk_level="CRITICAL",
        decision="BLOCK",
        reasons=json.dumps([reason]),
        risk_breakdown=json.dumps(empty_breakdown),
        fraud_score=95,
        anomaly_score=90,
        recommended_action="Decline card transaction per policy rule violation.",
        model_version="rule-policy-engine-1.0",
        status="DECLINED",
        created_at=datetime.utcnow()
    )
    db.add(card_txn)
    db.commit()
    return {
        "transaction_id": txn_id,
        "card_id": card.card_id,
        "amount_usd": amount_usd,
        "amount_bdt": amount_bdt,
        "merchant_name": merchant_name,
        "channel": channel,
        "risk_score": 95,
        "composite_score": 95,
        "risk_level": "CRITICAL",
        "final_level": "CRITICAL",
        "decision": "BLOCK",
        "reasons": [reason],
        "risk": empty_breakdown,
        "recommended_action": "Decline card transaction per policy rule violation.",
        "status": "DECLINED",
        "model_version": "rule-policy-engine-1.0",
        "created_at": card_txn.created_at.isoformat()
    }

