"""
Explainable AI (XAI) using SHAP for Fraud Model
"""

import sys
from pathlib import Path
from typing import Dict, Any, List
import pandas as pd
import numpy as np
import shap
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from data_factory.config import TEST_DATA_DIR, EVIDENCE_DIR
from ml.fraud.features import prepare_fraud_features, FRAUD_FEATURE_COLUMNS
from ml.fraud.predict import get_fraud_model

_EXPLAINER = None

HUMAN_READABLE_FEATURE_NAMES = {
    "amount_deviation": "Transaction amount significantly deviates from historical baseline",
    "is_new_device": "Transaction initiated from an unrecognized device",
    "is_new_recipient": "Transfer to an unverified new counterparty",
    "is_new_location": "Transaction geolocation unusual for customer",
    "velocity_1h": "Sudden burst in 1-hour transaction frequency",
    "velocity_24h": "Elevated 24-hour transaction velocity",
    "is_international": "Cross-border international payment channel",
    "amount_bdt": "High absolute transaction monetary value",
    "historical_avg_amount": "Customer historical spend baseline",
    "txn_type_code": "High-risk transaction operational type",
    "channel_code": "Access channel risk weighting",
    "recipient_type_code": "Recipient classification type"
}

def get_fraud_explainer():
    """Lazy load TreeExplainer for Fraud model."""
    global _EXPLAINER
    if _EXPLAINER is None:
        model = get_fraud_model()
        _EXPLAINER = shap.TreeExplainer(model)
    return _EXPLAINER

def generate_global_shap_summary():
    """Generate and save global SHAP summary beeswarm plot."""
    test_file = TEST_DATA_DIR / "transactions_test.csv"
    if not test_file.exists():
        return
        
    df_test = pd.read_csv(test_file).head(1000)
    X_test = prepare_fraud_features(df_test)
    
    explainer = get_fraud_explainer()
    shap_values = explainer.shap_values(X_test)
    
    plt.figure(figsize=(8, 5.5), dpi=150)
    shap.summary_plot(shap_values, X_test, show=False, plot_size=(8, 5.5))
    plt.title("SHAP Feature Importance — Fraud Risk XGBoost", fontsize=12, fontweight="bold", pad=12)
    plt.tight_layout()
    
    save_path = EVIDENCE_DIR / "shap_fraud_summary.png"
    plt.savefig(save_path, bbox_inches="tight")
    plt.close()
    print(f"[SAVED] Global SHAP summary plot: {save_path}")

def explain_transaction(transaction_data: Dict[str, Any], top_k: int = 4) -> Dict[str, Any]:
    """
    Generate structured local explanation reasons for a single transaction.
    """
    df = pd.DataFrame([transaction_data])
    X = prepare_fraud_features(df)
    
    explainer = get_fraud_explainer()
    shap_values = explainer.shap_values(X)[0] # single row
    
    feature_impacts = []
    for col, val, shap_val in zip(FRAUD_FEATURE_COLUMNS, X.iloc[0], shap_values):
        feature_impacts.append({
            "feature": col,
            "feature_name": HUMAN_READABLE_FEATURE_NAMES.get(col, col),
            "value": float(val),
            "shap_value": float(shap_val),
            "direction": "RISK_INCREASING" if shap_val > 0 else "RISK_DECREASING"
        })
        
    # Sort features by positive risk impact
    risk_increasing = [f for f in feature_impacts if f["shap_value"] > 0]
    risk_increasing.sort(key=lambda x: x["shap_value"], reverse=True)
    
    # Risk decreasing (protective factors)
    risk_decreasing = [f for f in feature_impacts if f["shap_value"] < 0]
    risk_decreasing.sort(key=lambda x: x["shap_value"])
    
    top_reasons = [f["feature_name"] for f in risk_increasing[:top_k]]
    
    return {
        "top_risk_reasons": top_reasons,
        "feature_attributions": feature_impacts,
        "risk_increasing_factors": risk_increasing[:top_k],
        "protective_factors": risk_decreasing[:top_k]
    }

if __name__ == "__main__":
    generate_global_shap_summary()
