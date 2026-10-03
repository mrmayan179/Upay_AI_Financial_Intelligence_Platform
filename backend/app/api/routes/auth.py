"""
Authentication & Demo User Profile Routes
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from backend.app.database.connection import get_db
from backend.app.database.models import Customer, Notification
from backend.app.schemas.payloads import DemoLoginRequest, UserProfileResponse

router = APIRouter(prefix="", tags=["Auth & Profile"])

@router.post("/auth/demo-login", response_model=UserProfileResponse)
def demo_login(payload: DemoLoginRequest, db: Session = Depends(get_db)):
    cust = db.query(Customer).filter(Customer.raw_phone == payload.phone_number).first()
    if not cust:
        # Fallback to default demo user
        cust = db.query(Customer).first()
    if not cust:
        raise HTTPException(status_code=404, detail="No demo accounts initialized")
        
    return {
        "customer_id": cust.customer_id,
        "display_name": cust.display_name,
        "phone_masked": cust.phone_masked,
        "raw_phone": cust.raw_phone,
        "account_number": cust.account_number,
        "account_balance_bdt": cust.account_balance_bdt,
        "cash_reward_bdt": cust.cash_reward_bdt,
        "status": cust.status
    }

@router.post("/auth/logout")
def demo_logout():
    return {"status": "SUCCESS", "message": "Demo session terminated"}

@router.get("/me", response_model=UserProfileResponse)
def get_current_user(db: Session = Depends(get_db)):
    cust = db.query(Customer).first()
    if not cust:
        raise HTTPException(status_code=404, detail="Demo account not found")
    return {
        "customer_id": cust.customer_id,
        "display_name": cust.display_name,
        "phone_masked": cust.phone_masked,
        "raw_phone": cust.raw_phone,
        "account_number": cust.account_number,
        "account_balance_bdt": cust.account_balance_bdt,
        "cash_reward_bdt": cust.cash_reward_bdt,
        "status": cust.status
    }

@router.get("/notifications")
def get_notifications(db: Session = Depends(get_db)):
    notifs = db.query(Notification).order_by(Notification.created_at.desc()).limit(15).all()
    return [
        {
            "notification_id": n.notification_id,
            "title": n.title,
            "message": n.message,
            "type": n.type,
            "read": n.read,
            "action_url": n.action_url,
            "created_at": n.created_at.isoformat()
        }
        for n in notifs
    ]
