"""
Unified Risk Engine Endpoint — Combines Model 1, Model 2, and Rule Engine
"""

from fastapi import APIRouter, HTTPException
from api.schemas.payloads import TransactionAnalyzeRequest, UnifiedRiskResponse
from ml.common.risk_engine import evaluate_unified_risk

router = APIRouter(prefix="/ml/risk", tags=["Unified Risk Engine"])

@router.post("/unified", response_model=UnifiedRiskResponse)
def analyze_unified_risk(payload: TransactionAnalyzeRequest):
    """
    Combined multi-tier risk evaluation combining:
    - Fraud XGBoost Probability
    - Behavioral Isolation Forest Anomaly
    - Business Rule Engine (separation of rules from ML)
    - SHAP Explainability & Actionable Decision
    """
    try:
        data = payload.model_dump()
        if data.get("amount_deviation") is None:
            data["amount_deviation"] = data["amount_bdt"] / max(1.0, data["historical_avg_amount"])
        result = evaluate_unified_risk(data)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
