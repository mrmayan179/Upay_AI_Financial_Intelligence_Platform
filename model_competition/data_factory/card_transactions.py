"""
Card Transaction Entity Generator
Generates card spending records with risk assessments.
"""

import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from data_factory.config import RANDOM_SEED

def generate_card_transactions(
    cards_df: pd.DataFrame,
    n_transactions: int,
    seed: int = RANDOM_SEED
) -> pd.DataFrame:
    """Generate n synthetic card transactions."""
    rng = np.random.default_rng(seed)
    
    active_cards = cards_df[cards_df["status"] == "ACTIVE"]
    if active_cards.empty:
        active_cards = cards_df
        
    card_ids = active_cards["card_id"].values
    cust_ids = active_cards["customer_id"].values
    n_cards = len(active_cards)
    
    start_time = datetime(2026, 1, 1, 0, 0, 0)
    total_seconds = int((datetime(2026, 9, 30, 23, 59, 59) - start_time).total_seconds())
    offsets = np.sort(rng.integers(0, total_seconds, size=n_transactions))
    
    countries = ["BD", "US", "SG", "GB", "IN", "AE"]
    country_weights = [0.45, 0.25, 0.12, 0.08, 0.06, 0.04]
    
    channels = ["ONLINE", "POS", "CONTACTLESS", "ATM"]
    channel_weights = [0.50, 0.30, 0.15, 0.05]
    
    rows = []
    for i in range(n_transactions):
        c_idx = rng.integers(0, n_cards)
        card_id = card_ids[c_idx]
        cust_id = cust_ids[c_idx]
        
        txn_time = start_time + timedelta(seconds=int(offsets[i]))
        channel = rng.choice(channels, p=channel_weights)
        country = rng.choice(countries, p=country_weights)
        
        is_contactless = 1 if channel == "CONTACTLESS" else 0
        is_online = 1 if channel == "ONLINE" else 0
        is_international = 1 if country != "BD" else 0
        
        is_new_merchant = 1 if rng.random() < 0.22 else 0
        is_new_device = 1 if rng.random() < 0.08 else 0
        
        amount_usd = round(float(rng.lognormal(mean=3.2, sigma=0.9)), 2)
        amount_usd = max(1.50, min(amount_usd, 3500.00))
        
        # Risk assessment simulation
        base_risk = 12.0
        if is_international: base_risk += 18.0
        if is_new_device: base_risk += 30.0
        if is_new_merchant: base_risk += 14.0
        if amount_usd > 500.0: base_risk += 20.0
        base_risk += rng.normal(0, 5)
        risk_score = int(max(0, min(100, round(base_risk))))
        fraud_prob = round(risk_score / 100.0, 4)
        
        rows.append({
            "card_transaction_id": f"SYN-CTXN-{1000001 + i}",
            "card_id": card_id,
            "customer_id": cust_id,
            "timestamp": txn_time.isoformat(),
            "amount_usd": amount_usd,
            "merchant_id": f"M-CARD-{rng.integers(100, 999)}",
            "merchant_country": country,
            "device_id": f"DEV-{rng.integers(100000, 999999):06X}",
            "channel": channel,
            "is_contactless": is_contactless,
            "is_online": is_online,
            "is_international": is_international,
            "is_new_merchant": is_new_merchant,
            "is_new_device": is_new_device,
            "risk_score": risk_score,
            "fraud_probability": fraud_prob
        })
        
    return pd.DataFrame(rows)
