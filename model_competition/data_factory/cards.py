"""
Card Entity Generator
Generates synthetic card accounts linked to Upay customers.
"""

import numpy as np
import pandas as pd
from datetime import date, timedelta
from data_factory.config import RANDOM_SEED

def generate_cards(customers_df: pd.DataFrame, n_cards: int, seed: int = RANDOM_SEED) -> pd.DataFrame:
    """Generate n synthetic cards assigned to customers."""
    rng = np.random.default_rng(seed)
    
    customer_ids = customers_df["customer_id"].values
    chosen_cids = rng.choice(customer_ids, size=n_cards, replace=False if n_cards <= len(customer_ids) else True)
    
    card_types = rng.choice(
        ["VIRTUAL_PREPAID", "PHYSICAL_DEBIT", "DUAL_CURRENCY"],
        size=n_cards,
        p=[0.45, 0.35, 0.20]
    )
    
    statuses = rng.choice(["ACTIVE", "FROZEN", "BLOCKED", "EXPIRED"], size=n_cards, p=[0.91, 0.04, 0.03, 0.02])
    
    base_issue = date(2024, 1, 1)
    
    rows = []
    for i in range(n_cards):
        cid = chosen_cids[i]
        ctype = card_types[i]
        status = statuses[i]
        
        currency = "DUAL" if ctype == "DUAL_CURRENCY" else rng.choice(["BDT", "USD"], p=[0.75, 0.25])
        
        issue_days = rng.integers(0, 700)
        issue_d = base_issue + timedelta(days=int(issue_days))
        expiry_d = issue_d + timedelta(days=365 * 3)
        
        nfc = 1 if ctype != "VIRTUAL_PREPAID" and rng.random() < 0.85 else 0
        online = 1 if status == "ACTIVE" and rng.random() < 0.95 else 0
        international = 1 if currency in ["USD", "DUAL"] and rng.random() < 0.80 else 0
        pin_status = "SET" if status == "ACTIVE" else rng.choice(["SET", "UNSET", "LOCKED"], p=[0.60, 0.25, 0.15])
        
        limit_usd = round(float(rng.choice([1000.0, 2000.0, 5000.0, 10000.0, 12000.0], p=[0.3, 0.35, 0.2, 0.1, 0.05])), 2)
        used_usd = round(float(rng.uniform(0.0, limit_usd * 0.75)), 2) if international else 0.0
        avail_usd = round(limit_usd - used_usd, 2)
        
        rows.append({
            "card_id": f"SYN-CRD-{10001 + i}",
            "customer_id": cid,
            "card_type": ctype,
            "currency": currency,
            "status": status,
            "issue_date": issue_d.isoformat(),
            "expiry_date": expiry_d.isoformat(),
            "nfc_enabled": nfc,
            "online_enabled": online,
            "international_enabled": international,
            "pin_status": pin_status,
            "endorsement_limit_usd": limit_usd,
            "used_usd": used_usd,
            "available_usd": avail_usd
        })
        
    return pd.DataFrame(rows)
