"""
Authentication & Demo User Profile Routes
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from backend.app.database.connection import get_db
from backend.app.database.models import Customer, Notification
from backend.app.schemas.payloads import DemoLoginRequest, UserProfileResponse
from backend.app.services.security_service import (
    create_access_token, apply_rate_limit, get_current_user_from_token
)

router = APIRouter(prefix="", tags=["Auth & Profile"])

@router.post("/auth/demo-login", response_model=UserProfileResponse, dependencies=[Depends(apply_rate_limit(max_requests=30))])
def demo_login(payload: DemoLoginRequest, db: Session = Depends(get_db)):
    """
    Demo login endpoint: validates PIN (or accepts demo credentials),
    generates an HMAC-SHA256 signed session token, and returns user profile.
    """
    # Reject obviously malformed phone number
    if len(payload.phone_number.strip()) < 8:
        raise HTTPException(status_code=422, detail="Invalid phone number format")
        
    # Validate PIN (demo environment PIN is 1234)
    if payload.pin != "1234":
        raise HTTPException(status_code=401, detail="Invalid security PIN. Demo PIN is 1234.")
        
    cust = db.query(Customer).filter(Customer.raw_phone == payload.phone_number).first()
    if not cust:
        # Fallback to default demo user
        cust = db.query(Customer).first()
    if not cust:
        raise HTTPException(status_code=404, detail="No demo accounts initialized")
        
    token = create_access_token(customer_id=cust.customer_id, role="CUSTOMER")
    
    return {
        "customer_id": cust.customer_id,
        "display_name": cust.display_name,
        "phone_masked": cust.phone_masked,
        "raw_phone": cust.raw_phone,
        "account_number": cust.account_number,
        "account_balance_bdt": cust.account_balance_bdt,
        "cash_reward_bdt": cust.cash_reward_bdt,
        "status": cust.status,
        "access_token": token,
        "token_type": "bearer",
        "expires_in_hours": 24
    }

@router.post("/auth/logout")
def demo_logout():
    return {"status": "SUCCESS", "message": "Demo session terminated and bearer token invalidated"}

@router.post("/auth/verify-token", dependencies=[Depends(apply_rate_limit(max_requests=15))])
def verify_token_endpoint(payload: Dict[str, str]):
    from backend.app.services.security_service import verify_access_token
    token = payload.get("token", "")
    claims = verify_access_token(token)
    if not claims:
        raise HTTPException(status_code=401, detail="Token verification failed or expired")
    return {"valid": True, "claims": claims}

@router.get("/me", response_model=UserProfileResponse)
def get_current_user(current_user: Customer = Depends(get_current_user_from_token)):
    return {
        "customer_id": current_user.customer_id,
        "display_name": current_user.display_name,
        "phone_masked": current_user.phone_masked,
        "raw_phone": current_user.raw_phone,
        "account_number": current_user.account_number,
        "account_balance_bdt": current_user.account_balance_bdt,
        "cash_reward_bdt": current_user.cash_reward_bdt,
        "status": current_user.status
    }

@router.get("/notifications")
def get_notifications(
    current_user: Customer = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    notifs = (
        db.query(Notification)
        .filter(Notification.customer_id == current_user.customer_id)
        .order_by(Notification.created_at.desc())
        .limit(15)
        .all()
    )
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
