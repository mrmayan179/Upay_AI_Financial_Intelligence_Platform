"""
Fraud Risk Model Evaluation on Locked Test Dataset
"""

import sys
import json
from pathlib import Path
import pandas as pd
import numpy as np

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from data_factory.config import TEST_DATA_DIR, EVIDENCE_DIR
from ml.fraud.features import prepare_fraud_features
from ml.fraud.predict import get_fraud_model
from ml.common.metrics import compute_classification_metrics, plot_confusion_matrix, plot_roc_curve
from ml.common.model_registry import register_model, load_registry

def evaluate_fraud_model():
    print("=" * 60)
    print("EVALUATING FRAUD MODEL ON LOCKED TEST SET")
    print("=" * 60)
    
    test_file = TEST_DATA_DIR / "transactions_test.csv"
    if not test_file.exists():
        raise FileNotFoundError(f"Locked test file missing: {test_file}")
        
    df_test = pd.read_csv(test_file)
    X_test = prepare_fraud_features(df_test)
    y_test = df_test["fraud_label"].values
    
    model = get_fraud_model()
    y_prob = model.predict_proba(X_test)[:, 1]
    y_pred = (y_prob >= 0.50).astype(int)
    
    metrics = compute_classification_metrics(y_test, y_pred, y_prob)
    
    print(f"Test Records: {len(X_test):,}")
    print(f"Accuracy:     {metrics['accuracy']:.4f}")
    print(f"Precision:    {metrics['precision']:.4f}")
    print(f"Recall:       {metrics['recall']:.4f}")
    print(f"F1-Score:     {metrics['f1']:.4f}")
    print(f"ROC-AUC:      {metrics['roc_auc']:.4f}")
    print(f"PR-AUC:       {metrics['pr_auc']:.4f}")
    print(f"Confusion Matrix: TN={metrics['confusion_matrix']['tn']}, FP={metrics['confusion_matrix']['fp']}, FN={metrics['confusion_matrix']['fn']}, TP={metrics['confusion_matrix']['tp']}")
    
    # Save plots
    cm_path = EVIDENCE_DIR / "confusion_matrix_fraud.png"
    plot_confusion_matrix(metrics["confusion_matrix"], "Fraud XGBoost — Confusion Matrix", cm_path)
    
    roc_path = EVIDENCE_DIR / "roc_curve_fraud.png"
    plot_roc_curve(y_test, y_prob, "Fraud XGBoost — ROC Curve", roc_path)
    print(f"[SAVED] Confusion matrix plot: {cm_path}")
    print(f"[SAVED] ROC curve plot: {roc_path}")
    
    # Update global evidence metrics file
    metrics_file = EVIDENCE_DIR / "model_metrics.json"
    data = {}
    if metrics_file.exists():
        try:
            with open(metrics_file, "r") as f:
                data = json.load(f)
        except Exception:
            data = {}
    data["fraud_model"] = metrics
    with open(metrics_file, "w") as f:
        json.dump(data, f, indent=2)
        
    # Update Model Registry
    reg = load_registry()
    if "fraud_risk_xgboost" in reg.get("models", {}):
        reg["models"]["fraud_risk_xgboost"]["metrics"] = metrics
        with open(EVIDENCE_DIR.parent / "models" / "model_registry.json", "w") as f:
            json.dump(reg, f, indent=2)
            
    print("=" * 60)
    return metrics

if __name__ == "__main__":
    evaluate_fraud_model()
