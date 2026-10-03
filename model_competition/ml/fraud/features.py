"""
Fraud Model Feature Engineering
"""

import pandas as pd
from typing import List
from ml.common.preprocessing import encode_fraud_features

FRAUD_FEATURE_COLUMNS: List[str] = [
    "amount_bdt",
    "amount_deviation",
    "is_new_recipient",
    "is_new_device",
    "is_new_location",
    "velocity_1h",
    "velocity_24h",
    "historical_avg_amount",
    "is_international",
    "txn_type_code",
    "channel_code",
    "recipient_type_code"
]

def prepare_fraud_features(df: pd.DataFrame) -> pd.DataFrame:
    """Extract and order features for Fraud XGBoost model."""
    encoded_df = encode_fraud_features(df)
    return encoded_df[FRAUD_FEATURE_COLUMNS]
