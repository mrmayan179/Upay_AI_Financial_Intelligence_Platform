"""
Explainable AI (XAI) using SHAP for Credit Model
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
from ml.credit.features import prepare_credit_features, CREDIT_FEATURE_COLUMNS
from ml.credit.predict import get_credit_model

_CREDIT_EXPLAINER = None

CREDIT_REASON_MAP = {
    "income_consistency": ("Stable and predictable periodic cash inflows", "Unpredictable and volatile cash inflows"),
    "balance_stability": ("Healthy retained wallet balance over time", "Rapid depletion of deposits with low average balance"),
    "cashout_ratio": ("High digital ecosystem retention and merchant spending", "Excessive immediate cash-out drain"),
    "previous_repayment_rate": ("Excellent historical micro-credit repayment integrity", "History of overdue or delinquent installments"),
    "avg_days_late": ("Negligible or zero installment delay", "Repeated extended repayment delinquency"),
    "account_age_days": ("Established account longevity and trust history", "Relatively new account with limited behavioral history"),
    "outflow_to_inflow_ratio": ("Disciplined cash outflow comfortably below total income", "Strained expenditure nearing or exceeding inflows"),
    "previous_loan_count": ("Demonstrated experience managing credit facilities", "No prior borrowing credit track record"),
    "avg_monthly_inflow": ("Substantial monthly cash flow capacity", "Limited monthly inward transaction volume")
}

def get_credit_explainer():
    """Lazy load TreeExplainer for Credit model."""
    global _CREDIT_EXPLAINER
    if _CREDIT_EXPLAINER is None:
        model = get_credit_model()
        _CREDIT_EXPLAINER = shap.TreeExplainer(model)
    return _CREDIT_EXPLAINER

def generate_global_credit_shap_summary():
    """Generate and save global SHAP summary beeswarm plot for credit."""
    test_file = TEST_DATA_DIR / "credit_test.csv"
    if not test_file.exists():
        return
        
    df_test = pd.read_csv(test_file).head(1000)
    X_test = prepare_credit_features(df_test)
    
    explainer = get_credit_explainer()
    shap_values = explainer.shap_values(X_test)
    
    plt.figure(figsize=(8, 5.5), dpi=150)
    shap.summary_plot(shap_values, X_test, show=False, plot_size=(8, 5.5))
    plt.title("SHAP Feature Importance — Credit Readiness XGBoost", fontsize=12, fontweight="bold", pad=12)
    plt.tight_layout()
    
    save_path = EVIDENCE_DIR / "shap_credit_summary.png"
    plt.savefig(save_path, bbox_inches="tight")
    plt.close()
    print(f"[SAVED] Global Credit SHAP summary plot: {save_path}")

def explain_credit_profile(credit_data: Dict[str, Any], top_k: int = 3) -> Dict[str, Any]:
    """
    Generate structured positive and negative factor reasons for a credit profile.
    """
    df = pd.DataFrame([credit_data])
    X = prepare_credit_features(df)
    
    explainer = get_credit_explainer()
    shap_values = explainer.shap_values(X)[0] # single row
    
    # Note: Model target is credit_risk_label (1 = risk, 0 = safe).
    # Therefore, negative SHAP reduces risk (POSITIVE for credit readiness!)
    # Positive SHAP increases risk (NEGATIVE for credit readiness!)
    positive_reasons = [] # Reduces risk
    negative_reasons = [] # Increases risk
    
    for col, shap_val in zip(CREDIT_FEATURE_COLUMNS, shap_values):
        pos_desc, neg_desc = CREDIT_REASON_MAP.get(col, (f"Favorable {col}", f"Unfavorable {col}"))
        if shap_val < -0.05:
            positive_reasons.append({
                "factor": col,
                "description": f"+ {pos_desc}",
                "impact_magnitude": float(abs(shap_val))
            })
        elif shap_val > 0.05:
            negative_reasons.append({
                "factor": col,
                "description": f"- {neg_desc}",
                "impact_magnitude": float(shap_val)
            })
            
    positive_reasons.sort(key=lambda x: x["impact_magnitude"], reverse=True)
    negative_reasons.sort(key=lambda x: x["impact_magnitude"], reverse=True)
    
    return {
        "positive_factors": [item["description"] for item in positive_reasons[:top_k]],
        "negative_factors": [item["description"] for item in negative_reasons[:top_k]],
        "raw_shap_breakdown": {col: float(val) for col, val in zip(CREDIT_FEATURE_COLUMNS, shap_values)}
    }

if __name__ == "__main__":
    generate_global_credit_shap_summary()
