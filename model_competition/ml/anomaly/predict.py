"""
Behavioral Anomaly Inference Service
"""

import sys
from pathlib import Path
from typing import Dict, Any, Union
import joblib
import pandas as pd
import numpy as np

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from data_factory.config import MODELS_DIR
from ml.anomaly.features import prepare_anomaly_features

_ANOMALY_MODEL = None
MODEL_FILENAME = "anomaly_iforest.joblib"
MODEL_VERSION = "anomaly-iforest-1.0.0"

def get_anomaly_model():
    """Lazy load Isolation Forest model."""
    global _ANOMALY_MODEL
    if _ANOMALY_MODEL is None:
        model_path = MODELS_DIR / MODEL_FILENAME
        if not model_path.exists():
            raise FileNotFoundError(f"Anomaly model missing at {model_path}. Train model first.")
        _ANOMALY_MODEL = joblib.load(model_path)
    return _ANOMALY_MODEL

def predict_anomaly(transaction_data: Union[Dict[str, Any], pd.DataFrame]) -> Dict[str, Any]:
    """
    Score transaction for behavioral anomaly.
    Returns anomaly_score (0.0 to 1.0) and anomaly_flag.
    """
    model = get_anomaly_model()
    
    if isinstance(transaction_data, dict):
        df = pd.DataFrame([transaction_data])
    else:
        df = transaction_data.copy()
        
    X = prepare_anomaly_features(df)
    
    # decision_function yields signed distance: negative = anomalous, positive = normal
    raw_scores = model.decision_function(X)
    raw_score = float(raw_scores[0])
    
    # Normalize to 0.0 to 1.0 scale where higher means more anomalous
    # Empirical decision_function ranges from -0.35 to +0.25
    norm_score = float(np.clip(0.5 - (raw_score * 2.0), 0.0, 1.0))
    is_anomaly = bool(norm_score >= 0.58 or raw_score < 0)
    
    # Identify specific behavioral deviations
    factors = []
    row = X.iloc[0]
    if row["amount_deviation"] > 3.0:
        factors.append(f"Spending spike: {row['amount_deviation']:.1f}x higher than usual average")
    if row["velocity_1h"] >= 3:
        factors.append(f"High 1-hour burst: {int(row['velocity_1h'])} transactions")
    if row["is_new_device"] == 1:
        factors.append("Unseen device fingerprint")
    if row["is_new_location"] == 1:
        factors.append("Unusual geographic location")
    if row["hour_of_day"] < 5 or row["hour_of_day"] > 23:
        factors.append(f"Unusual transaction time ({int(row['hour_of_day'])}:00 hours)")
        
    return {
        "anomaly_score": round(norm_score, 4),
        "raw_decision_score": round(raw_score, 4),
        "anomaly_flag": is_anomaly,
        "deviation_factors": factors,
        "model_version": MODEL_VERSION
    }
