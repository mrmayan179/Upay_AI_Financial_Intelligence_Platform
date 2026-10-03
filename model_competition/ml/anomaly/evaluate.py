"""
Behavioral Anomaly Model Evaluation on Locked Test Dataset
"""

import sys
import json
from pathlib import Path
import pandas as pd
import numpy as np

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from data_factory.config import TEST_DATA_DIR, EVIDENCE_DIR
from ml.anomaly.features import prepare_anomaly_features
from ml.anomaly.predict import get_anomaly_model
from ml.common.model_registry import load_registry

def evaluate_anomaly_model():
    print("=" * 60)
    print("EVALUATING BEHAVIORAL ANOMALY MODEL ON LOCKED TEST SET")
    print("=" * 60)
    
    test_file = TEST_DATA_DIR / "transactions_test.csv"
    if not test_file.exists():
        raise FileNotFoundError(f"Locked test file missing: {test_file}")
        
    df_test = pd.read_csv(test_file)
    X_test = prepare_anomaly_features(df_test)
    y_test_fraud = df_test["fraud_label"].values
    
    model = get_anomaly_model()
    raw_scores = model.decision_function(X_test)
    preds = model.predict(X_test) # -1 = anomaly, 1 = inlier
    is_anomaly = (preds == -1)
    
    total_test = len(df_test)
    total_anomalies_flagged = int(np.sum(is_anomaly))
    anomaly_rate = float(total_anomalies_flagged / total_test)
    
    # Ground-truth overlap: How many frauds did unsupervised anomaly catch?
    fraud_indices = (y_test_fraud == 1)
    normal_indices = (y_test_fraud == 0)
    
    fraud_detected = int(np.sum(is_anomaly[fraud_indices]))
    total_frauds = int(np.sum(fraud_indices))
    fraud_detection_rate = float(fraud_detected / max(1, total_frauds))
    
    normal_flagged = int(np.sum(is_anomaly[normal_indices]))
    total_normals = int(np.sum(normal_indices))
    false_positive_rate = float(normal_flagged / max(1, total_normals))
    
    metrics = {
        "total_test_transactions": total_test,
        "total_flagged_anomalies": total_anomalies_flagged,
        "anomaly_flag_rate": round(anomaly_rate, 4),
        "fraud_anomaly_capture_rate": round(fraud_detection_rate, 4),
        "normal_transaction_fpr": round(false_positive_rate, 4),
        "raw_score_mean": round(float(np.mean(raw_scores)), 4),
        "raw_score_std": round(float(np.std(raw_scores)), 4)
    }
    
    print(f"Total Test Transactions: {total_test:,}")
    print(f"Flagged Anomalies:       {total_anomalies_flagged:,} ({anomaly_rate*100:.2f}%)")
    print(f"Fraud Capture Rate:      {fraud_detection_rate*100:.2f}% ({fraud_detected}/{total_frauds})")
    print(f"Normal FPR:              {false_positive_rate*100:.2f}% ({normal_flagged}/{total_normals})")
    print(f"Mean Decision Score:     {metrics['raw_score_mean']}")
    
    # Save results
    results_file = EVIDENCE_DIR / "anomaly_test_results.json"
    with open(results_file, "w") as f:
        json.dump(metrics, f, indent=2)
    print(f"[SAVED] Anomaly test results: {results_file}")
    
    # Update global metrics file
    metrics_file = EVIDENCE_DIR / "model_metrics.json"
    data = {}
    if metrics_file.exists():
        try:
            with open(metrics_file, "r") as f:
                data = json.load(f)
        except Exception:
            data = {}
    data["anomaly_model"] = metrics
    with open(metrics_file, "w") as f:
        json.dump(data, f, indent=2)
        
    print("=" * 60)
    return metrics

if __name__ == "__main__":
    evaluate_anomaly_model()
