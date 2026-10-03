"""
Behavioral Anomaly Feature Extraction
"""

import pandas as pd
from typing import List
from ml.common.preprocessing import encode_anomaly_features

ANOMALY_FEATURE_COLUMNS: List[str] = [
    "amount_bdt",
    "amount_deviation",
    "velocity_1h",
    "velocity_24h",
    "historical_avg_amount",
    "is_new_device",
    "is_new_location",
    "is_international",
    "hour_of_day"
]

def prepare_anomaly_features(df: pd.DataFrame) -> pd.DataFrame:
    """Extract and order features for Anomaly Isolation Forest."""
    encoded_df = encode_anomaly_features(df)
    return encoded_df[ANOMALY_FEATURE_COLUMNS]
