"""
Credit Readiness Assessment Route
"""

from fastapi import APIRouter, HTTPException
from api.schemas.payloads import CreditAnalyzeRequest, CreditAnalyzeResponse
from ml.credit.predict import predict_credit_readiness

router = APIRouter(prefix="/ml/credit", tags=["Credit Readiness (Model 3)"])

@router.post("/analyze", response_model=CreditAnalyzeResponse)
def analyze_credit_readiness(payload: CreditAnalyzeRequest):
    """
    Assess customer credit readiness using Credit XGBoost Model.
    """
    try:
        data = payload.model_dump()
        result = predict_credit_readiness(data)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
