"""
Behavioral Anomaly Detection Route
"""

from fastapi import APIRouter, HTTPException
from api.schemas.payloads import TransactionAnalyzeRequest, AnomalyAnalyzeResponse
from ml.anomaly.predict import predict_anomaly

router = APIRouter(prefix="/ml/anomaly", tags=["Behavioral Anomaly (Model 2)"])

@router.post("/analyze", response_model=AnomalyAnalyzeResponse)
def analyze_behavioral_anomaly(payload: TransactionAnalyzeRequest):
    """
    Detect behavioral anomalies using unsupervised Isolation Forest.
    """
    try:
        data = payload.model_dump()
        if data.get("amount_deviation") is None:
            data["amount_deviation"] = data["amount_bdt"] / max(1.0, data["historical_avg_amount"])
        result = predict_anomaly(data)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
