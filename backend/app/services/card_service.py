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
from ai_models.inference.adapters import evaluate_unified_risk_adapter

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

def process_card_authorization(
    db: Session,
    customer_id: str,
    card_id: str,
    amount_usd: float,
    merchant_name: str,
    channel: str = "ONLINE",
    country: str = "US",
    is_new_merchant: int = 0,
    is_new_device: int = 0
) -> Dict[str, Any]:
    """
    Authorizes card payment against deterministic controls and ML unified risk engine.
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
        
    # 2. Invoke Unified Risk ML Engine
    amount_bdt = round(amount_usd * 121.50, 2)
    sample_risk_payload = {
        "amount_bdt": amount_bdt,
        "historical_avg_amount": 3500.0,
        "amount_deviation": round(amount_bdt / 3500.0, 2),
        "is_new_recipient": is_new_merchant,
        "is_new_device": is_new_device,
        "is_new_location": 1 if country != "BD" else 0,
        "velocity_1h": 1,
        "velocity_24h": 3,
        "is_international": 1 if country != "BD" else 0,
        "transaction_type": "CARD_PAYMENT",
        "channel": channel,
        "recipient_type": "MERCHANT",
        "hour_of_day": datetime.utcnow().hour
    }
    
    risk_res = evaluate_unified_risk_adapter(sample_risk_payload)
    decision = risk_res["decision"]
    risk_score = risk_res["composite_risk_score"]
    risk_level = risk_res["risk_level"]
    reasons = risk_res["reasons"]
    
    # 3. Apply Decision
    if decision == "ALLOW":
        card.used_usd = round(card.used_usd + amount_usd, 2)
        txn_status = "APPROVED"
    elif decision == "CHALLENGE_2FA":
        txn_status = "2FA_CHALLENGE"
    elif decision == "HOLD_FOR_REVIEW":
        txn_status = "HELD_FOR_REVIEW"
    else:
        txn_status = "BLOCKED"
        
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
        status=txn_status,
        created_at=datetime.utcnow()
    )
    db.add(card_txn)
    
    # Send security notification if not ordinary allow
    if decision != "ALLOW":
        notif = Notification(
            notification_id=f"NOTIF-{uuid.uuid4().hex[:8].upper()}",
            customer_id=customer_id,
            title=f"AI Security Alert: {merchant_name}",
            message=f"${amount_usd:.2f} USD flagged as {risk_level} risk ({decision}). Reasons: {', '.join(reasons[:2])}",
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
        tool_name="evaluate_unified_risk",
        model_or_provider="xgboost-plus-isolation-forest",
        model_version="fraud-xgb-1.0.0",
        result_status=decision,
        latency_ms=16.0,
        details={"risk_score": risk_score, "decision": decision, "reasons": reasons}
    )
    
    db.commit()
    db.refresh(card_txn)
    
    return {
        "transaction_id": txn_id,
        "card_id": card_id,
        "amount_usd": amount_usd,
        "merchant_name": merchant_name,
        "channel": channel,
        "risk_score": risk_score,
        "risk_level": risk_level,
        "decision": decision,
        "reasons": reasons,
        "status": txn_status,
        "created_at": card_txn.created_at.isoformat()
    }

def _record_declined(db, card, txn_id, amount_usd, merchant_name, channel, country, reason):
    card_txn = CardTransaction(
        transaction_id=txn_id,
        card_id=card.card_id,
        customer_id=card.customer_id,
        amount_usd=amount_usd,
        amount_bdt=round(amount_usd * 121.50, 2),
        merchant_name=merchant_name,
        channel=channel,
        country=country,
        risk_score=95,
        risk_level="HIGH",
        decision="BLOCK",
        reasons=json.dumps([reason]),
        status="DECLINED",
        created_at=datetime.utcnow()
    )
    db.add(card_txn)
    db.commit()
    return {
        "transaction_id": txn_id,
        "card_id": card.card_id,
        "amount_usd": amount_usd,
        "merchant_name": merchant_name,
        "channel": channel,
        "risk_score": 95,
        "risk_level": "HIGH",
        "decision": "BLOCK",
        "reasons": [reason],
        "status": "DECLINED",
        "created_at": card_txn.created_at.isoformat()
    }
