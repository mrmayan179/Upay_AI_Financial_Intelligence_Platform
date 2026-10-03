"""
Fraud XGBoost Model Training Script
"""

import sys
import os
import joblib
from pathlib import Path
import pandas as pd
import numpy as np
from xgboost import XGBClassifier

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from data_factory.config import TRAIN_DATA_DIR, MODELS_DIR, RANDOM_SEED
from ml.fraud.features import prepare_fraud_features, FRAUD_FEATURE_COLUMNS
from ml.common.model_registry import register_model

MODEL_FILENAME = "fraud_xgb.joblib"
MODEL_VERSION = "fraud-xgb-1.0.0"

def train_fraud_model():
    print("=" * 60)
    print("TRAINING FRAUD RISK MODEL (XGBoost)")
    print("=" * 60)
    
    train_file = TRAIN_DATA_DIR / "transactions_train.csv"
    if not train_file.exists():
        raise FileNotFoundError(f"Training file not found: {train_file}. Run split_dataset.py first.")
        
    df_train = pd.read_csv(train_file)
    X_train = prepare_fraud_features(df_train)
    y_train = df_train["fraud_label"].values
    
    n_pos = np.sum(y_train == 1)
    n_neg = np.sum(y_train == 0)
    scale_pos = round(float(n_neg / max(1, n_pos)), 2)
    print(f"Dataset: {len(X_train):,} records | Positives (Fraud): {n_pos:,} | Negatives: {n_neg:,} | Scale Weight: {scale_pos}")
    
    hyperparams = {
        "n_estimators": 160,
        "max_depth": 5,
        "learning_rate": 0.07,
        "subsample": 0.85,
        "colsample_bytree": 0.85,
        "scale_pos_weight": min(scale_pos, 8.0), # balanced weight for high F1 and Precision
        "random_state": RANDOM_SEED,
        "eval_metric": "logloss",
        "n_jobs": -1
    }
    
    clf = XGBClassifier(**hyperparams)
    clf.fit(X_train, y_train)
    
    # Save model artifact
    artifact_path = MODELS_DIR / MODEL_FILENAME
    joblib.dump(clf, artifact_path)
    print(f"[SUCCESS] Trained model saved to: {artifact_path}")
    
    # Register model
    register_model(
        model_name="fraud_risk_xgboost",
        model_version=MODEL_VERSION,
        algorithm="XGBoost Classifier",
        features=FRAUD_FEATURE_COLUMNS,
        hyperparameters=hyperparams,
        metrics={"status": "trained_ready_for_locked_evaluation"},
        artifact_filename=MODEL_FILENAME
    )
    print(f"[SUCCESS] Registered {MODEL_VERSION} in Model Registry.")
    return clf

if __name__ == "__main__":
    train_fraud_model()
