"""
Credit Readiness XGBoost Model Training Script
"""

import sys
import joblib
from pathlib import Path
import pandas as pd
import numpy as np
from xgboost import XGBClassifier

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from data_factory.config import TRAIN_DATA_DIR, MODELS_DIR, RANDOM_SEED
from ml.credit.features import prepare_credit_features, CREDIT_FEATURE_COLUMNS
from ml.common.model_registry import register_model

MODEL_FILENAME = "credit_xgb.joblib"
MODEL_VERSION = "credit-xgb-1.0.0"

def train_credit_model():
    print("=" * 60)
    print("TRAINING CREDIT READINESS MODEL (XGBoost)")
    print("=" * 60)
    
    train_file = TRAIN_DATA_DIR / "credit_train.csv"
    if not train_file.exists():
        raise FileNotFoundError(f"Credit training file missing: {train_file}")
        
    df_train = pd.read_csv(train_file)
    X_train = prepare_credit_features(df_train)
    y_train = df_train["credit_risk_label"].values
    
    n_pos = np.sum(y_train == 1) # High risk
    n_neg = np.sum(y_train == 0) # Credit ready
    scale_pos = round(float(n_neg / max(1, n_pos)), 2)
    print(f"Credit Records: {len(X_train):,} | High Risk: {n_pos:,} | Credit Ready: {n_neg:,} | Scale Weight: {scale_pos}")
    
    hyperparams = {
        "n_estimators": 140,
        "max_depth": 4,
        "learning_rate": 0.08,
        "subsample": 0.85,
        "colsample_bytree": 0.85,
        "scale_pos_weight": min(scale_pos, 6.0),
        "random_state": RANDOM_SEED,
        "eval_metric": "logloss",
        "n_jobs": -1
    }
    
    clf = XGBClassifier(**hyperparams)
    clf.fit(X_train, y_train)
    
    artifact_path = MODELS_DIR / MODEL_FILENAME
    joblib.dump(clf, artifact_path)
    print(f"[SUCCESS] Trained Credit model saved to: {artifact_path}")
    
    register_model(
        model_name="credit_readiness_xgboost",
        model_version=MODEL_VERSION,
        algorithm="XGBoost Classifier",
        features=CREDIT_FEATURE_COLUMNS,
        hyperparameters=hyperparams,
        metrics={"status": "trained_ready_for_locked_evaluation"},
        artifact_filename=MODEL_FILENAME
    )
    print(f"[SUCCESS] Registered {MODEL_VERSION} in Model Registry.")
    return clf

if __name__ == "__main__":
    train_credit_model()
