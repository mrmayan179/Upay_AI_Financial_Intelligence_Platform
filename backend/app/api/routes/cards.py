"""
Dual-Currency Smart Card & AI Security Routes
Fully secured with route-level authentication and server-side customer authorization.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any
import json

from backend.app.database.connection import get_db
from backend.app.database.models import Customer, Card, CardTransaction
from backend.app.schemas.payloads import (
    CardSchema, CardSettingsUpdateRequest, CardPinResetRequest,
    CardTransactionSimulationRequest, CardTransactionResponse,
    CardPreCheckRequest, CardPreCheckResponse
)
from backend.app.services.card_service import (
    get_user_cards, get_card_by_id, update_card_toggles,
    freeze_card_toggle, reset_mock_pin, process_card_authorization,
    pre_check_card_transaction
)
from backend.app.services.security_service import (
    get_current_user_from_token, verify_customer_authorization
)

router = APIRouter(prefix="/cards", tags=["Dual-Currency Smart Card"])

@router.get("", response_model=List[CardSchema])
def list_cards(
    current_user: Customer = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Lists all smart cards belonging strictly to the authenticated customer."""
    cards = get_user_cards(db, current_user.customer_id)
    return [
        {
            "card_id": c.card_id,
            "customer_id": c.customer_id,
            "card_type": c.card_type,
            "card_title": c.card_title,
            "card_number_masked": c.card_number_masked,
            "card_number_full": c.card_number_full,
            "expiry_date": c.expiry_date,
            "cvv": c.cvv,
            "status": c.status,
            "card_enabled": c.card_enabled,
            "online_enabled": c.online_enabled,
            "international_enabled": c.international_enabled,
            "nfc_enabled": c.nfc_enabled,
            "endorsement_usd": c.endorsement_usd,
            "used_usd": c.used_usd,
            "available_usd": round(c.endorsement_usd - c.used_usd, 2)
        }
        for c in cards
    ]

@router.get("/{card_id}", response_model=CardSchema)
def get_card(
    card_id: str,
    current_user: Customer = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Retrieves specific card details with strict tenant authorization verification."""
    c = get_card_by_id(db, card_id)
    if not c:
        raise HTTPException(status_code=404, detail="Card not found")
    verify_customer_authorization(c.customer_id, current_user.customer_id)
    
    return {
        "card_id": c.card_id,
        "customer_id": c.customer_id,
        "card_type": c.card_type,
        "card_title": c.card_title,
        "card_number_masked": c.card_number_masked,
        "card_number_full": c.card_number_full,
        "expiry_date": c.expiry_date,
        "cvv": c.cvv,
        "status": c.status,
        "card_enabled": c.card_enabled,
        "online_enabled": c.online_enabled,
        "international_enabled": c.international_enabled,
        "nfc_enabled": c.nfc_enabled,
        "endorsement_usd": c.endorsement_usd,
        "used_usd": c.used_usd,
        "available_usd": round(c.endorsement_usd - c.used_usd, 2)
    }

@router.patch("/{card_id}/settings", response_model=CardSchema)
def update_card_settings(
    card_id: str,
    payload: CardSettingsUpdateRequest,
    current_user: Customer = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Updates security toggles with authorization enforcement."""
    c = get_card_by_id(db, card_id)
    if not c:
        raise HTTPException(status_code=404, detail="Card not found")
    verify_customer_authorization(c.customer_id, current_user.customer_id)
    
    updated = update_card_toggles(db, card_id, payload.model_dump(exclude_unset=True))
    return {
        "card_id": updated.card_id,
        "customer_id": updated.customer_id,
        "card_type": updated.card_type,
        "card_title": updated.card_title,
        "card_number_masked": updated.card_number_masked,
        "card_number_full": updated.card_number_full,
        "expiry_date": updated.expiry_date,
        "cvv": updated.cvv,
        "status": updated.status,
        "card_enabled": updated.card_enabled,
        "online_enabled": updated.online_enabled,
        "international_enabled": updated.international_enabled,
        "nfc_enabled": updated.nfc_enabled,
        "endorsement_usd": updated.endorsement_usd,
        "used_usd": updated.used_usd,
        "available_usd": round(updated.endorsement_usd - updated.used_usd, 2)
    }

@router.post("/{card_id}/freeze", response_model=CardSchema)
def toggle_freeze(
    card_id: str,
    current_user: Customer = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Freezes or unfreezes card with authorization check."""
    c = get_card_by_id(db, card_id)
    if not c:
        raise HTTPException(status_code=404, detail="Card not found")
    verify_customer_authorization(c.customer_id, current_user.customer_id)
    
    updated = freeze_card_toggle(db, card_id)
    return {
        "card_id": updated.card_id,
        "customer_id": updated.customer_id,
        "card_type": updated.card_type,
        "card_title": updated.card_title,
        "card_number_masked": updated.card_number_masked,
        "card_number_full": updated.card_number_full,
        "expiry_date": updated.expiry_date,
        "cvv": updated.cvv,
        "status": updated.status,
        "card_enabled": updated.card_enabled,
        "online_enabled": updated.online_enabled,
        "international_enabled": updated.international_enabled,
        "nfc_enabled": updated.nfc_enabled,
        "endorsement_usd": updated.endorsement_usd,
        "used_usd": updated.used_usd,
        "available_usd": round(updated.endorsement_usd - updated.used_usd, 2)
    }

@router.post("/{card_id}/pin/reset-demo")
def reset_card_pin_endpoint(
    card_id: str,
    payload: CardPinResetRequest,
    current_user: Customer = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Resets card PIN with authorization check."""
    c = get_card_by_id(db, card_id)
    if not c:
        raise HTTPException(status_code=404, detail="Card not found")
    verify_customer_authorization(c.customer_id, current_user.customer_id)
    
    res = reset_mock_pin(db, card_id, payload.current_pin, payload.new_pin)
    if not res["success"]:
        raise HTTPException(status_code=400, detail=res["message"])
    return res

@router.post("/transactions/pre-check", response_model=CardPreCheckResponse)
def pre_check_transaction_risk(
    payload: CardPreCheckRequest,
    current_user: Customer = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """
    Evaluates transaction risk against runtime database features BEFORE execution.
    Provides customer-facing proactive warnings and coaching.
    Strictly verifies card ownership.
    """
    c = get_card_by_id(db, payload.card_id)
    if not c:
        raise HTTPException(status_code=404, detail="Card not found")
    verify_customer_authorization(c.customer_id, current_user.customer_id)
    
    result = pre_check_card_transaction(
        db=db,
        customer_id=current_user.customer_id,
        card_id=payload.card_id,
        amount_usd=payload.amount_usd,
        merchant_name=payload.merchant_name,
        channel=payload.channel,
        country=payload.country,
        device_id=payload.device_id or "DEV-APP-01",
        is_new_merchant=payload.is_new_merchant,
        is_new_device=payload.is_new_device
    )
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result

@router.post("/transactions/analyze", response_model=CardTransactionResponse)
def analyze_and_execute_transaction(
    payload: CardTransactionSimulationRequest,
    current_user: Customer = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """
    Executes transaction authorization, evaluates ML models, and saves record.
    Strictly verifies card ownership.
    """
    c = get_card_by_id(db, payload.card_id)
    if not c:
        raise HTTPException(status_code=404, detail="Card not found")
    verify_customer_authorization(c.customer_id, current_user.customer_id)
    
    result = process_card_authorization(
        db=db,
        customer_id=current_user.customer_id,
        card_id=payload.card_id,
        amount_usd=payload.amount_usd,
        merchant_name=payload.merchant_name,
        channel=payload.channel,
        country=payload.country,
        is_new_merchant=payload.is_new_merchant,
        is_new_device=payload.is_new_device
    )
    return result

@router.get("/transactions/{transaction_id}/analysis")
def get_transaction_analysis(
    transaction_id: str,
    current_user: Customer = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """
    Retrieves complete runtime feature values, model scores, and risk breakdown
    for a transaction record from the database with authorization check.
    """
    txn = db.query(CardTransaction).filter(CardTransaction.transaction_id == transaction_id).first()
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction record not found in database")
    verify_customer_authorization(txn.customer_id, current_user.customer_id)
        
    return {
        "transaction_id": txn.transaction_id,
        "card_id": txn.card_id,
        "customer_id": txn.customer_id,
        "amount_usd": txn.amount_usd,
        "amount_bdt": txn.amount_bdt,
        "merchant_name": txn.merchant_name,
        "channel": txn.channel,
        "country": txn.country,
        "risk_score": txn.risk_score,
        "risk_level": txn.risk_level,
        "final_level": txn.risk_level,
        "decision": txn.decision,
        "status": txn.status,
        "fraud_score": txn.fraud_score,
        "anomaly_score": txn.anomaly_score,
        "device_id": txn.device_id,
        "recommended_action": txn.recommended_action,
        "model_version": txn.model_version,
        "reasons": json.loads(txn.reasons) if txn.reasons else [],
        "risk": json.loads(txn.risk_breakdown) if txn.risk_breakdown else {},
        "created_at": txn.created_at.isoformat()
    }

@router.get("/{card_id}/transactions")
def get_card_transactions(
    card_id: str,
    current_user: Customer = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Retrieves transaction history for a card with authorization check."""
    c = get_card_by_id(db, card_id)
    if not c:
        raise HTTPException(status_code=404, detail="Card not found")
    verify_customer_authorization(c.customer_id, current_user.customer_id)
    
    txns = db.query(CardTransaction).filter(CardTransaction.card_id == card_id).order_by(CardTransaction.created_at.desc()).limit(20).all()
    return [
        {
            "transaction_id": t.transaction_id,
            "card_id": t.card_id,
            "amount_usd": t.amount_usd,
            "amount_bdt": t.amount_bdt,
            "merchant_name": t.merchant_name,
            "channel": t.channel,
            "risk_score": t.risk_score,
            "composite_score": t.risk_score,
            "risk_level": t.risk_level,
            "final_level": t.risk_level,
            "decision": t.decision,
            "fraud_score": t.fraud_score,
            "anomaly_score": t.anomaly_score,
            "recommended_action": t.recommended_action,
            "model_version": t.model_version,
            "reasons": json.loads(t.reasons) if t.reasons else [],
            "risk": json.loads(t.risk_breakdown) if t.risk_breakdown else {},
            "status": t.status,
            "created_at": t.created_at.isoformat()
        }
        for t in txns
    ]
