"""
Fraud Risk Scoring Route
"""

from fastapi import APIRouter, HTTPException
from api.schemas.payloads import TransactionAnalyzeRequest, FraudAnalyzeResponse
from ml.fraud.predict import predict_fraud

router = APIRouter(prefix="/ml/fraud", tags=["Fraud Risk (Model 1)"])

@router.post("/analyze", response_model=FraudAnalyzeResponse)
def analyze_fraud_risk(payload: TransactionAnalyzeRequest):
    """
    Score financial transaction using Fraud XGBoost Classifier.
    """
    try:
        data = payload.model_dump()
        if data.get("amount_deviation") is None:
            data["amount_deviation"] = data["amount_bdt"] / max(1.0, data["historical_avg_amount"])
        result = predict_fraud(data)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
