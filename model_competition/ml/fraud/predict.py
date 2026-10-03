"""
Fraud Risk Inference Service
"""

import sys
from pathlib import Path
from typing import Dict, Any, Union
import joblib
import pandas as pd

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from data_factory.config import MODELS_DIR
from ml.fraud.features import prepare_fraud_features

_FRAUD_MODEL = None
MODEL_FILENAME = "fraud_xgb.joblib"
MODEL_VERSION = "fraud-xgb-1.0.0"

def get_fraud_model():
    """Lazy load and cache trained model."""
    global _FRAUD_MODEL
    if _FRAUD_MODEL is None:
        model_path = MODELS_DIR / MODEL_FILENAME
        if not model_path.exists():
            raise FileNotFoundError(f"Model file not found at {model_path}. Train model first.")
        _FRAUD_MODEL = joblib.load(model_path)
    return _FRAUD_MODEL

def predict_fraud(transaction_data: Union[Dict[str, Any], pd.DataFrame]) -> Dict[str, Any]:
    """
    Score transaction for fraud risk.
    Accepts single record dictionary or DataFrame.
    """
    model = get_fraud_model()
    
    if isinstance(transaction_data, dict):
        df = pd.DataFrame([transaction_data])
    else:
        df = transaction_data.copy()
        
    X = prepare_fraud_features(df)
    probs = model.predict_proba(X)[:, 1]
    prob = float(probs[0])
    
    risk_score = int(round(prob * 100))
    if risk_score >= 70:
        risk_class = "HIGH"
    elif risk_score >= 40:
        risk_class = "MEDIUM"
    else:
        risk_class = "LOW"
        
    return {
        "fraud_probability": round(prob, 4),
        "risk_score": risk_score,
        "risk_class": risk_class,
        "model_version": MODEL_VERSION
    }
