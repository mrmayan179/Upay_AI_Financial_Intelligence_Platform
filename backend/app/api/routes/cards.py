"""
Dual-Currency Smart Card & AI Security Routes
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from backend.app.database.connection import get_db
from backend.app.database.models import Customer, Card, CardTransaction
from backend.app.schemas.payloads import (
    CardSchema, CardSettingsUpdateRequest, CardPinResetRequest,
    CardTransactionSimulationRequest, CardTransactionResponse
)
from backend.app.services.card_service import (
    get_user_cards, get_card_by_id, update_card_toggles,
    freeze_card_toggle, reset_mock_pin, process_card_authorization
)

router = APIRouter(prefix="/cards", tags=["Dual-Currency Smart Card"])

@router.get("", response_model=List[CardSchema])
def list_cards(db: Session = Depends(get_db)):
    cust = db.query(Customer).first()
    customer_id = cust.customer_id if cust else "SYN-U-10082"
    cards = get_user_cards(db, customer_id)
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
def get_card(card_id: str, db: Session = Depends(get_db)):
    c = get_card_by_id(db, card_id)
    if not c:
        raise HTTPException(status_code=404, detail="Card not found")
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
def update_card_settings(card_id: str, payload: CardSettingsUpdateRequest, db: Session = Depends(get_db)):
    c = update_card_toggles(db, card_id, payload.model_dump(exclude_unset=True))
    if not c:
        raise HTTPException(status_code=404, detail="Card not found")
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

@router.post("/{card_id}/freeze", response_model=CardSchema)
def toggle_freeze(card_id: str, db: Session = Depends(get_db)):
    c = freeze_card_toggle(db, card_id)
    if not c:
        raise HTTPException(status_code=404, detail="Card not found")
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

@router.post("/{card_id}/pin/reset-demo")
def reset_card_pin_endpoint(card_id: str, payload: CardPinResetRequest, db: Session = Depends(get_db)):
    res = reset_mock_pin(db, card_id, payload.current_pin, payload.new_pin)
    if not res["success"]:
        raise HTTPException(status_code=400, detail=res["message"])
    return res

@router.post("/transactions/analyze", response_model=CardTransactionResponse)
def analyze_and_execute_transaction(payload: CardTransactionSimulationRequest, db: Session = Depends(get_db)):
    cust = db.query(Customer).first()
    customer_id = cust.customer_id if cust else "SYN-U-10082"
    
    result = process_card_authorization(
        db=db,
        customer_id=customer_id,
        card_id=payload.card_id,
        amount_usd=payload.amount_usd,
        merchant_name=payload.merchant_name,
        channel=payload.channel,
        country=payload.country,
        is_new_merchant=payload.is_new_merchant or 0,
        is_new_device=payload.is_new_device or 0
    )
    return result

@router.get("/{card_id}/transactions")
def get_card_transactions(card_id: str, db: Session = Depends(get_db)):
    import json
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
            "risk_level": t.risk_level,
            "decision": t.decision,
            "reasons": json.loads(t.reasons) if t.reasons else [],
            "status": t.status,
            "created_at": t.created_at.isoformat()
        }
        for t in txns
    ]
