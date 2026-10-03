"""
AI Credit Readiness & Loan Recommendation Routes
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Any
from backend.app.database.connection import get_db
from backend.app.database.models import Customer
from backend.app.schemas.payloads import CreditReadinessResponse
from backend.app.services.credit_service import get_or_create_credit_readiness, request_formal_credit_review

router = APIRouter(prefix="/credit", tags=["Credit Readiness & Loan"])

@router.get("/readiness", response_model=CreditReadinessResponse)
def get_readiness_profile(db: Session = Depends(get_db)):
    cust = db.query(Customer).first()
    customer_id = cust.customer_id if cust else "SYN-U-10082"
    result = get_or_create_credit_readiness(db, customer_id)
    return result

@router.post("/review-request")
def submit_review_request(db: Session = Depends(get_db)):
    cust = db.query(Customer).first()
    customer_id = cust.customer_id if cust else "SYN-U-10082"
    result = request_formal_credit_review(db, customer_id)
    return result
