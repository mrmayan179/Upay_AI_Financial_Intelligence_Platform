"""
Credit Readiness Inference Service
"""

import sys
from pathlib import Path
from typing import Dict, Any, Union
import joblib
import pandas as pd

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from data_factory.config import MODELS_DIR
from ml.credit.features import prepare_credit_features

_CREDIT_MODEL = None
MODEL_FILENAME = "credit_xgb.joblib"
MODEL_VERSION = "credit-xgb-1.0.0"

REGULATORY_DISCLAIMER = (
    "NOTICE: The credit readiness score is a synthetic AI decision-support indicator "
    "and does not constitute a loan approval or underwriting guarantee. "
    "Final credit underwriting and disbursement decisions reside exclusively with partner licensed banking institutions."
)

def get_credit_model():
    """Lazy load Credit XGBoost model."""
    global _CREDIT_MODEL
    if _CREDIT_MODEL is None:
        model_path = MODELS_DIR / MODEL_FILENAME
        if not model_path.exists():
            raise FileNotFoundError(f"Credit model missing at {model_path}. Train model first.")
        _CREDIT_MODEL = joblib.load(model_path)
    return _CREDIT_MODEL

def predict_credit_readiness(credit_data: Union[Dict[str, Any], pd.DataFrame]) -> Dict[str, Any]:
    """
    Evaluate customer financial profile for credit readiness.
    """
    model = get_credit_model()
    
    if isinstance(credit_data, dict):
        df = pd.DataFrame([credit_data])
    else:
        df = credit_data.copy()
        
    X = prepare_credit_features(df)
    risk_probs = model.predict_proba(X)[:, 1]
    risk_prob = float(risk_probs[0])
    
    # Credit readiness score: Invert risk probability to 0-100 scale (100 = best)
    readiness_score = int(round((1.0 - risk_prob) * 100))
    readiness_score = max(5, min(98, readiness_score))
    
    inflow = float(df["avg_monthly_inflow"].iloc[0]) if "avg_monthly_inflow" in df.columns else 35000.0
    
    if readiness_score >= 70:
        risk_category = "LOW"
        min_limit = round(inflow * 0.40, -2)
        max_limit = round(inflow * 0.85, -2)
        suggested_range = f"BDT {min_limit:,.0f} - BDT {max_limit:,.0f}"
        recommendation = "RECOMMENDED_FOR_PARTNER_REVIEW"
    elif readiness_score >= 45:
        risk_category = "MEDIUM"
        min_limit = round(inflow * 0.20, -2)
        max_limit = round(inflow * 0.40, -2)
        suggested_range = f"BDT {min_limit:,.0f} - BDT {max_limit:,.0f}"
        recommendation = "CONDITIONAL_MICRO_CREDIT"
    else:
        risk_category = "HIGH"
        suggested_range = "BDT 0 (Credit readiness criteria not met)"
        recommendation = "COACHING_REQUIRED_HIGH_RISK"
        
    return {
        "credit_readiness_score": readiness_score,
        "risk_probability": round(risk_prob, 4),
        "risk_category": risk_category,
        "suggested_limit_range_bdt": suggested_range,
        "recommendation": recommendation,
        "disclaimer": REGULATORY_DISCLAIMER,
        "model_version": MODEL_VERSION
    }
