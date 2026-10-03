"""
Train / Test Dataset Splitter & Test Set Lock Mechanism
Enforces 80/20 partition and locks the evaluation test set with cryptographic hashes.
"""

import sys
import json
import hashlib
from pathlib import Path
import pandas as pd
from sklearn.model_selection import train_test_split

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from data_factory.config import (
    RAW_DATA_DIR,
    TRAIN_DATA_DIR,
    TEST_DATA_DIR,
    RANDOM_SEED,
    TRAIN_RATIO,
    TEST_RATIO
)

def compute_checksum(filepath: Path) -> str:
    """Compute SHA-256 hash of a file."""
    sha256 = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(8192):
            sha256.update(chunk)
    return sha256.hexdigest()

def split_and_lock_datasets():
    print("=" * 60)
    print("PARTITIONING & LOCKING TRAIN/TEST DATASETS (80/20)")
    print(f"Seed: {RANDOM_SEED} | Train: {int(TRAIN_RATIO*100)}% | Test: {int(TEST_RATIO*100)}%")
    print("=" * 60)
    
    # 1. Customers Split
    customers_df = pd.read_csv(RAW_DATA_DIR / "customers.csv")
    cust_train, cust_test = train_test_split(
        customers_df, test_size=TEST_RATIO, random_state=RANDOM_SEED, stratify=customers_df["customer_segment"]
    )
    cust_train.to_csv(TRAIN_DATA_DIR / "customers_train.csv", index=False)
    cust_test.to_csv(TEST_DATA_DIR / "customers_test.csv", index=False)
    print(f"Customers: Train={len(cust_train):,} rows, Test={len(cust_test):,} rows")
    
    # 2. Transactions Split (Stratified by fraud_label)
    txns_df = pd.read_csv(RAW_DATA_DIR / "transactions.csv")
    txn_train, txn_test = train_test_split(
        txns_df, test_size=TEST_RATIO, random_state=RANDOM_SEED, stratify=txns_df["fraud_label"]
    )
    txn_train.to_csv(TRAIN_DATA_DIR / "transactions_train.csv", index=False)
    txn_test.to_csv(TEST_DATA_DIR / "transactions_test.csv", index=False)
    print(f"Transactions: Train={len(txn_train):,} rows, Test={len(txn_test):,} rows (Fraud rate Train: {txn_train['fraud_label'].mean()*100:.2f}%, Test: {txn_test['fraud_label'].mean()*100:.2f}%)")
    
    # 3. Credit Profiles Split (Stratified by credit_risk_label)
    credit_df = pd.read_csv(RAW_DATA_DIR / "credit_profiles.csv")
    credit_train, credit_test = train_test_split(
        credit_df, test_size=TEST_RATIO, random_state=RANDOM_SEED, stratify=credit_df["credit_risk_label"]
    )
    credit_train.to_csv(TRAIN_DATA_DIR / "credit_train.csv", index=False)
    credit_test.to_csv(TEST_DATA_DIR / "credit_test.csv", index=False)
    print(f"Credit Profiles: Train={len(credit_train):,} rows, Test={len(credit_test):,} rows")
    
    # Compute Hashes and Lock Manifest
    lock_manifest = {
        "status": "LOCKED",
        "lock_timestamp": pd.Timestamp.now().isoformat(),
        "random_seed": RANDOM_SEED,
        "split_ratio": {"train": TRAIN_RATIO, "test": TEST_RATIO},
        "description": "This test partition is cryptographically locked for unbiased model evaluation. It must NEVER be used for training, feature selection, or hyperparameter tuning.",
        "files": {
            "customers_test.csv": {
                "rows": len(cust_test),
                "sha256": compute_checksum(TEST_DATA_DIR / "customers_test.csv")
            },
            "transactions_test.csv": {
                "rows": len(txn_test),
                "sha256": compute_checksum(TEST_DATA_DIR / "transactions_test.csv"),
                "fraud_rate": float(txn_test["fraud_label"].mean())
            },
            "credit_test.csv": {
                "rows": len(credit_test),
                "sha256": compute_checksum(TEST_DATA_DIR / "credit_test.csv"),
                "high_risk_rate": float(credit_test["credit_risk_label"].mean())
            }
        }
    }
    
    lock_file = TEST_DATA_DIR / "LOCKED_TEST_DATASET.json"
    with open(lock_file, "w") as f:
        json.dump(lock_manifest, f, indent=2)
        
    print("-" * 60)
    print(f"LOCKED TEST MANIFEST SAVED: {lock_file}")
    print("Test set is sealed and ready for unbiased evaluation.")
    print("-" * 60)

if __name__ == "__main__":
    split_and_lock_datasets()
