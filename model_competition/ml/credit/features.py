"""
Credit Readiness Feature Extraction
"""

import pandas as pd
from typing import List
from ml.common.preprocessing import encode_credit_features

CREDIT_FEATURE_COLUMNS: List[str] = [
    "avg_monthly_inflow",
    "avg_monthly_outflow",
    "income_consistency",
    "balance_stability",
    "cashout_ratio",
    "transaction_frequency",
    "account_age_days",
    "previous_loan_count",
    "previous_repayment_rate",
    "late_payment_count",
    "avg_days_late",
    "outflow_to_inflow_ratio"
]

def prepare_credit_features(df: pd.DataFrame) -> pd.DataFrame:
    """Extract and order features for Credit XGBoost model."""
    encoded_df = encode_credit_features(df)
    return encoded_df[CREDIT_FEATURE_COLUMNS]
