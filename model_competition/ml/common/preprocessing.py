"""
Common Preprocessing & Encoding Utilities
"""

import pandas as pd
import numpy as np

# Canonical categorical maps to ensure identical numeric encoding during train and inference
TRANSACTION_TYPE_MAP = {
    "PAYMENT": 0, "SEND_MONEY": 1, "CASH_OUT": 2, "CASH_IN": 3,
    "TRANSFER": 4, "BILL_PAYMENT": 5, "CARD_PAYMENT": 6, "INTERNATIONAL_PAYMENT": 7, "REFUND": 8
}

CHANNEL_MAP = {
    "APP": 0, "USSD": 1, "QR": 2, "WEB": 3, "POS": 4
}

RECIPIENT_TYPE_MAP = {
    "MERCHANT": 0, "AGENT": 1, "CUSTOMER": 2, "UTILITY_BILLER": 3, "BANK": 4
}

MERCHANT_CATEGORY_MAP = {
    "GROCERY": 0, "RESTAURANT": 1, "E_COMMERCE": 2, "UTILITY": 3,
    "TRAVEL": 4, "DIGITAL_SERVICE": 5, "EDUCATION": 6, "N/A": 7
}

def encode_fraud_features(df: pd.DataFrame) -> pd.DataFrame:
    """Transform transaction dataframe into feature matrix for Fraud Model."""
    features = pd.DataFrame(index=df.index)
    
    features["amount_bdt"] = df["amount_bdt"].astype(float)
    features["amount_deviation"] = df["amount_deviation"].astype(float)
    features["is_new_recipient"] = df["is_new_recipient"].astype(int)
    features["is_new_device"] = df["is_new_device"].astype(int)
    features["is_new_location"] = df["is_new_location"].astype(int)
    features["velocity_1h"] = df["velocity_1h"].astype(float)
    features["velocity_24h"] = df["velocity_24h"].astype(float)
    features["historical_avg_amount"] = df["historical_avg_amount"].astype(float)
    features["is_international"] = df["is_international"].astype(int)
    
    # Categorical encodings
    features["txn_type_code"] = df["transaction_type"].map(lambda x: TRANSACTION_TYPE_MAP.get(str(x), 0))
    features["channel_code"] = df["channel"].map(lambda x: CHANNEL_MAP.get(str(x), 0))
    features["recipient_type_code"] = df["recipient_type"].map(lambda x: RECIPIENT_TYPE_MAP.get(str(x), 2))
    
    # Fill any NaNs with safe defaults
    features = features.fillna(0.0)
    return features

def encode_anomaly_features(df: pd.DataFrame) -> pd.DataFrame:
    """Transform transaction dataframe into feature matrix for Anomaly Isolation Forest."""
    features = pd.DataFrame(index=df.index)
    
    features["amount_bdt"] = df["amount_bdt"].astype(float)
    features["amount_deviation"] = df["amount_deviation"].astype(float)
    features["velocity_1h"] = df["velocity_1h"].astype(float)
    features["velocity_24h"] = df["velocity_24h"].astype(float)
    features["historical_avg_amount"] = df["historical_avg_amount"].astype(float)
    features["is_new_device"] = df["is_new_device"].astype(int)
    features["is_new_location"] = df["is_new_location"].astype(int)
    features["is_international"] = df["is_international"].astype(int)
    
    # Extract hour of day from timestamp if available
    if "timestamp" in df.columns:
        hours = pd.to_datetime(df["timestamp"]).dt.hour
        features["hour_of_day"] = hours.astype(float)
    else:
        features["hour_of_day"] = 14.0
        
    features = features.fillna(0.0)
    return features

def encode_credit_features(df: pd.DataFrame) -> pd.DataFrame:
    """Transform credit profile dataframe into feature matrix for Credit Model."""
    features = pd.DataFrame(index=df.index)
    
    features["avg_monthly_inflow"] = df["avg_monthly_inflow"].astype(float)
    features["avg_monthly_outflow"] = df["avg_monthly_outflow"].astype(float)
    features["income_consistency"] = df["income_consistency"].astype(float)
    features["balance_stability"] = df["balance_stability"].astype(float)
    features["cashout_ratio"] = df["cashout_ratio"].astype(float)
    features["transaction_frequency"] = df["transaction_frequency"].astype(float)
    features["account_age_days"] = df["account_age_days"].astype(float)
    features["previous_loan_count"] = df["previous_loan_count"].astype(float)
    features["previous_repayment_rate"] = df["previous_repayment_rate"].astype(float)
    features["late_payment_count"] = df["late_payment_count"].astype(float)
    features["avg_days_late"] = df["avg_days_late"].astype(float)
    
    # Engineered ratio
    inflow = np.maximum(features["avg_monthly_inflow"].values, 1.0)
    features["outflow_to_inflow_ratio"] = features["avg_monthly_outflow"].values / inflow
    
    features = features.fillna(0.0)
    return features
