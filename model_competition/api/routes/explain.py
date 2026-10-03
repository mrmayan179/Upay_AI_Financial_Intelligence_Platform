"""
Explainable AI (XAI) Endpoints
"""

from fastapi import APIRouter, HTTPException
from typing import Dict, Any
from api.schemas.payloads import ExplainTransactionRequest, ExplainCreditRequest
from ml.fraud.explain import explain_transaction
from ml.credit.explain import explain_credit_profile

router = APIRouter(prefix="/ml/explain", tags=["Explainability (XAI)"])

@router.post("", response_model=Dict[str, Any])
def explain_transaction_risk(payload: ExplainTransactionRequest):
    """
    Generate SHAP-based feature attribution and structured reasons for transaction risk.
    """
    try:
        data = payload.transaction.model_dump()
        if data.get("amount_deviation") is None:
            data["amount_deviation"] = data["amount_bdt"] / max(1.0, data["historical_avg_amount"])
        result = explain_transaction(data, top_k=payload.top_k)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/credit", response_model=Dict[str, Any])
def explain_credit_assessment(payload: ExplainCreditRequest):
    """
    Generate SHAP-based positive and negative factor reasons for credit readiness.
    """
    try:
        data = payload.credit_profile.model_dump()
        result = explain_credit_profile(data, top_k=payload.top_k)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
