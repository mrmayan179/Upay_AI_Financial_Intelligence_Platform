"""
Merchant Entity Generator
Generates synthetic merchant registry for Upay payments.
"""

import numpy as np
import pandas as pd
from data_factory.config import (
    RANDOM_SEED,
    DISTRICTS,
    DISTRICT_WEIGHTS,
    MERCHANT_CATEGORIES,
    MERCHANT_CATEGORY_WEIGHTS,
)

def generate_merchants(n: int, seed: int = RANDOM_SEED) -> pd.DataFrame:
    """Generate n synthetic merchants."""
    rng = np.random.default_rng(seed)
    
    merchant_ids = [f"SYN-M-{1001 + i}" for i in range(n)]
    categories = rng.choice(MERCHANT_CATEGORIES, size=n, p=MERCHANT_CATEGORY_WEIGHTS)
    locations = rng.choice(DISTRICTS, size=n, p=DISTRICT_WEIGHTS)
    merchant_age_days = rng.integers(60, 3000, size=n)
    
    # Risk Profile: 78% LOW, 17% MEDIUM, 5% HIGH
    risk_profiles = rng.choice(["LOW", "MEDIUM", "HIGH"], size=n, p=[0.78, 0.17, 0.05])
    
    # Average transaction ticket based on vertical
    avg_txns = np.zeros(n, dtype=float)
    for i in range(n):
        cat = categories[i]
        if cat == "GROCERY":
            amt = rng.normal(850, 350)
        elif cat == "RESTAURANT":
            amt = rng.normal(1200, 500)
        elif cat == "E_COMMERCE":
            amt = rng.normal(3200, 1500)
        elif cat == "UTILITY":
            amt = rng.normal(2100, 800)
        elif cat == "TRAVEL":
            amt = rng.normal(8500, 4000)
        elif cat == "DIGITAL_SERVICE":
            amt = rng.normal(1500, 600)
        elif cat == "EDUCATION":
            amt = rng.normal(6000, 2500)
        else:
            amt = 1000.0
        avg_txns[i] = round(max(100.0, float(amt)), 2)
        
    frequencies = rng.choice(["HIGH", "MEDIUM", "LOW"], size=n, p=[0.25, 0.55, 0.20])
    
    df = pd.DataFrame({
        "merchant_id": merchant_ids,
        "merchant_category": categories,
        "merchant_location": locations,
        "merchant_age_days": merchant_age_days,
        "risk_profile": risk_profiles,
        "average_transaction": avg_txns,
        "transaction_frequency": frequencies
    })
    
    return df
