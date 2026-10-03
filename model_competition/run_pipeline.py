"""
Master Execution Pipeline for Upay AI Foundation
Executes all 8 stages from synthetic data generation to final evidence compilation.
"""

import sys
import time
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(PROJECT_ROOT))

from data_factory.config import DATASET_VERSION
from data_factory.generate_all import generate_all
from data_factory.validate import validate_datasets
from data_factory.split_dataset import split_and_lock_datasets
from ml.fraud.train import train_fraud_model
from ml.fraud.evaluate import evaluate_fraud_model
from ml.fraud.explain import generate_global_shap_summary
from ml.anomaly.train import train_anomaly_model
from ml.anomaly.evaluate import evaluate_anomaly_model
from ml.credit.train import train_credit_model
from ml.credit.evaluate import evaluate_credit_model
from ml.credit.explain import generate_global_credit_shap_summary
from tests.scenarios.run_all_scenarios import run_all_scenarios
from evidence.generate_report import generate_final_html_report

def run_master_pipeline():
    print("=" * 60)
    print("UPAY AI FOUNDATION PIPELINE")
    print("=" * 60)
    
    t_start = time.time()
    
    # [1/8] Generating synthetic data
    print("\n[1/8] Generating synthetic data       ...", end="", flush=True)
    t0 = time.time()
    generate_all()
    print(f" [PASS] ({time.time() - t0:.1f}s)")
    
    # [2/8] Validating data
    print("\n[2/8] Validating data                 ...", end="", flush=True)
    t0 = time.time()
    valid = validate_datasets()
    if not valid:
        print(" [FAIL] Dataset validation failed!")
        sys.exit(1)
    print(f" [PASS] ({time.time() - t0:.1f}s)")
    
    # [3/8] Creating train/test sets
    print("\n[3/8] Creating train/test sets        ...", end="", flush=True)
    t0 = time.time()
    split_and_lock_datasets()
    print(f" [PASS] ({time.time() - t0:.1f}s)")
    
    # [4/8] Training fraud model
    print("\n[4/8] Training fraud model            ...", end="", flush=True)
    t0 = time.time()
    train_fraud_model()
    evaluate_fraud_model()
    print(f" [PASS] ({time.time() - t0:.1f}s)")
    
    # [5/8] Training anomaly model
    print("\n[5/8] Training anomaly model          ...", end="", flush=True)
    t0 = time.time()
    train_anomaly_model()
    evaluate_anomaly_model()
    print(f" [PASS] ({time.time() - t0:.1f}s)")
    
    # [6/8] Training credit model
    print("\n[6/8] Training credit model           ...", end="", flush=True)
    t0 = time.time()
    train_credit_model()
    evaluate_credit_model()
    print(f" [PASS] ({time.time() - t0:.1f}s)")
    
    # [7/8] Generating SHAP explanations
    print("\n[7/8] Generating SHAP explanations    ...", end="", flush=True)
    t0 = time.time()
    generate_global_shap_summary()
    generate_global_credit_shap_summary()
    print(f" [PASS] ({time.time() - t0:.1f}s)")
    
    # [8/8] Running evaluation & scenarios
    print("\n[8/8] Running evaluation & scenarios  ...", end="", flush=True)
    t0 = time.time()
    run_all_scenarios()
    generate_final_html_report()
    print(f" [PASS] ({time.time() - t0:.1f}s)")
    
    elapsed = time.time() - t_start
    print("\n" + "=" * 60)
    print("All tests passed.")
    print("\nModels:")
    print("  - fraud-xgb-1.0.0")
    print("  - anomaly-iforest-1.0.0")
    print("  - credit-xgb-1.0.0")
    print("\nDataset:")
    print(f"  - synthetic-{DATASET_VERSION}")
    print("\nTest set:")
    print("  - LOCKED (data/test/LOCKED_TEST_DATASET.json)")
    print(f"\nEvidence generated in: evidence/ (including final_report.html)")
    print(f"Total Pipeline Runtime: {elapsed:.2f}s")
    print("=" * 60)

if __name__ == "__main__":
    run_master_pipeline()
