"""
Smart Report & Case Management Routes
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

router = APIRouter(prefix="/reports", tags=["Smart Report & Cases"])

@router.post("/intelligence/classify", response_model=ComplaintClassifyResponse)
def classify_complaint(payload: ComplaintClassifyRequest):
    result = classify_complaint_text(payload.text)
    return result

@router.post("", response_model=Dict[str, Any])
def create_report(payload: CreateReportRequest, db: Session = Depends(get_db)):
    cust = db.query(Customer).first()
    customer_id = cust.customer_id if cust else "SYN-U-10082"
    
    new_case = create_report_and_case(
        db=db,
        customer_id=customer_id,
        complaint_text=payload.complaint_text,
        category=payload.category,
        transaction_id=payload.transaction_id
    )
    return get_case_detail(db, new_case.case_id)

@router.get("/active", response_model=List[Dict[str, Any]])
def list_active_cases(db: Session = Depends(get_db)):
    cust = db.query(Customer).first()
    customer_id = cust.customer_id if cust else "SYN-U-10082"
    cases = get_active_cases(db, customer_id)
    return [get_case_detail(db, c.case_id) for c in cases]

@router.get("/{case_id}", response_model=Dict[str, Any])
def get_case(case_id: str, db: Session = Depends(get_db)):
    detail = get_case_detail(db, case_id)
    if not detail:
        raise HTTPException(status_code=404, detail="Case not found")
    return detail

@router.post("/{case_id}/escalate", response_model=Dict[str, Any])
def escalate_dispute(case_id: str, payload: EscalateCaseRequest, db: Session = Depends(get_db)):
    res = escalate_case(db, case_id, payload.reason)
    if not res:
        raise HTTPException(status_code=404, detail="Case not found")
    return get_case_detail(db, case_id)
