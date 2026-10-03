"""
Behavioral Anomaly Isolation Forest Training Script
"""

import sys
import joblib
from pathlib import Path
import pandas as pd
from sklearn.ensemble import IsolationForest

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from data_factory.config import TRAIN_DATA_DIR, MODELS_DIR, RANDOM_SEED
from ml.anomaly.features import prepare_anomaly_features, ANOMALY_FEATURE_COLUMNS
from ml.common.model_registry import register_model

MODEL_FILENAME = "anomaly_iforest.joblib"
MODEL_VERSION = "anomaly-iforest-1.0.0"

def train_anomaly_model():
    print("=" * 60)
    print("TRAINING BEHAVIORAL ANOMALY MODEL (Isolation Forest)")
    print("=" * 60)
    
    train_file = TRAIN_DATA_DIR / "transactions_train.csv"
    if not train_file.exists():
        raise FileNotFoundError(f"Training file missing: {train_file}")
        
    df_train = pd.read_csv(train_file)
    X_train = prepare_anomaly_features(df_train)
    
    hyperparams = {
        "n_estimators": 120,
        "max_samples": "auto",
        "contamination": 0.055, # aligned with expected anomaly frequency
        "random_state": RANDOM_SEED,
        "n_jobs": -1
    }
    
    iso_forest = IsolationForest(**hyperparams)
    iso_forest.fit(X_train)
    
    artifact_path = MODELS_DIR / MODEL_FILENAME
    joblib.dump(iso_forest, artifact_path)
    print(f"[SUCCESS] Trained Isolation Forest saved to: {artifact_path}")
    
    register_model(
        model_name="behavioral_anomaly_isolation_forest",
        model_version=MODEL_VERSION,
        algorithm="Isolation Forest",
        features=ANOMALY_FEATURE_COLUMNS,
        hyperparameters=hyperparams,
        metrics={"status": "trained_ready_for_locked_evaluation"},
        artifact_filename=MODEL_FILENAME
    )
    print(f"[SUCCESS] Registered {MODEL_VERSION} in Model Registry.")
    return iso_forest

if __name__ == "__main__":
    train_anomaly_model()
