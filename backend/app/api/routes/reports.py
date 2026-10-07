"""
Smart Report & Case Management Routes
Fully secured with route-level authentication and customer-context authorization.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from backend.app.database.connection import get_db
from backend.app.database.models import Customer
from backend.app.schemas.payloads import (
    ComplaintClassifyRequest, ComplaintClassifyResponse,
    CreateReportRequest, CaseSchema, EscalateCaseRequest
)
from backend.app.services.report_service import (
    classify_complaint_text, create_report_and_case,
    get_active_cases, get_case_detail, escalate_case
)
from backend.app.services.security_service import (
    get_current_user_from_token, verify_customer_authorization
)

router = APIRouter(prefix="/reports", tags=["Smart Report & Cases"])

@router.post("/intelligence/classify", response_model=ComplaintClassifyResponse)
def classify_complaint(payload: ComplaintClassifyRequest):
    """Real-time complaint text intent & category NLP classifier (public utility)."""
    result = classify_complaint_text(payload.text)
    return result

@router.post("", response_model=Dict[str, Any])
def create_report(
    payload: CreateReportRequest,
    current_user: Customer = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Creates a structured complaint and formal case bound to authenticated customer."""
    new_case = create_report_and_case(
        db=db,
        customer_id=current_user.customer_id,
        complaint_text=payload.complaint_text,
        category=payload.category,
        transaction_id=payload.transaction_id
    )
    return get_case_detail(db, new_case.case_id)

@router.get("/active", response_model=List[Dict[str, Any]])
def list_active_cases(
    current_user: Customer = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Lists active dispute cases belonging strictly to authenticated customer."""
    cases = get_active_cases(db, current_user.customer_id)
    return [get_case_detail(db, c.case_id) for c in cases]

@router.get("/{case_id}", response_model=Dict[str, Any])
def get_case(
    case_id: str,
    current_user: Customer = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Retrieves case details and timeline events with authorization enforcement."""
    detail = get_case_detail(db, case_id)
    if not detail:
        raise HTTPException(status_code=404, detail="Case not found")
    verify_customer_authorization(detail["customer_id"], current_user.customer_id)
    return detail

@router.post("/{case_id}/escalate", response_model=Dict[str, Any])
def escalate_dispute(
    case_id: str,
    payload: EscalateCaseRequest,
    current_user: Customer = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Escalates case to specialist team with authorization enforcement."""
    detail = get_case_detail(db, case_id)
    if not detail:
        raise HTTPException(status_code=404, detail="Case not found")
    verify_customer_authorization(detail["customer_id"], current_user.customer_id)
    
    res = escalate_case(db, case_id, payload.reason)
    if not res:
        raise HTTPException(status_code=404, detail="Case escalation failed")
    return get_case_detail(db, case_id)
