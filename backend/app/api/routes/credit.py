"""
AI Credit Readiness & Loan Recommendation Routes
Fully secured with route-level authentication and customer-context isolation.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Any
from backend.app.database.connection import get_db
from backend.app.database.models import Customer
from backend.app.schemas.payloads import CreditReadinessResponse
from backend.app.services.credit_service import get_or_create_credit_readiness, request_formal_credit_review
from backend.app.services.security_service import get_current_user_from_token

router = APIRouter(prefix="/credit", tags=["Credit Readiness & Loan"])

@router.get("/readiness", response_model=CreditReadinessResponse)
def get_readiness_profile(
    current_user: Customer = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Computes and returns credit readiness evaluation for authenticated customer."""
    result = get_or_create_credit_readiness(db, current_user.customer_id)
    return result

@router.post("/review-request")
def submit_review_request(
    current_user: Customer = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Submits formal partner bank credit evaluation request for authenticated customer."""
    result = request_formal_credit_review(db, current_user.customer_id)
    return result
