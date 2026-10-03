"""
Transaction Entity Generator
Generates realistic financial transactions with normal behavior and injected suspicious fraud patterns.
"""

import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from data_factory.config import (
    RANDOM_SEED,
    DISTRICTS,
    TRANSACTION_TYPES,
    TRANSACTION_TYPE_WEIGHTS,
)

def generate_transactions(
    customers_df: pd.DataFrame,
    merchants_df: pd.DataFrame,
    n_transactions: int,
    seed: int = RANDOM_SEED
) -> pd.DataFrame:
    """Generate connected transactions for synthetic customers and merchants."""
    rng = np.random.default_rng(seed)
    
    n_customers = len(customers_df)
    n_merchants = len(merchants_df)
    
    customer_ids = customers_df["customer_id"].values
    customer_districts = customers_df["district"].values
    customer_devices = customers_df["device_type"].values
    customer_incomes = customers_df["monthly_income"].values
    customer_accounts_age = customers_df["account_age_days"].values
    
    merchant_ids = merchants_df["merchant_id"].values
    merchant_cats = merchants_df["merchant_category"].values
    merchant_risks = merchants_df["risk_profile"].values
    
    # Pre-generate unique hardware device fingerprints for each customer
    cust_device_map = {cid: f"DEV-{hash(cid) & 0xFFFFFF:06X}" for cid in customer_ids}
    
    # Baseline historical average spend per customer (~2% to 6% of monthly income per typical txn)
    cust_hist_avg = {
        cid: round(max(200.0, float(inc * rng.uniform(0.02, 0.06))), 2)
        for cid, inc in zip(customer_ids, customer_incomes)
    }
    
    # Running balance tracking per customer
    cust_balance = {
        cid: round(float(inc * rng.uniform(0.4, 1.8)), 2)
        for cid, inc in zip(customer_ids, customer_incomes)
    }
    
    # Customer frequent contacts / merchants
    cust_known_recipients = {
        cid: list(rng.choice(merchant_ids, size=min(5, n_merchants), replace=False))
        for cid in customer_ids
    }
    
    # Time window: Jan 1, 2026 to Sep 30, 2026
    start_time = datetime(2026, 1, 1, 0, 0, 0)
    total_seconds = int((datetime(2026, 9, 30, 23, 59, 59) - start_time).total_seconds())
    
    # Generate sorted timestamps
    random_offsets = np.sort(rng.integers(0, total_seconds, size=n_transactions))
    
    # Target ~5.5% fraud rate
    target_fraud_count = int(n_transactions * 0.055)
    fraud_indices = set(rng.choice(n_transactions, size=target_fraud_count, replace=False))
    
    rows = []
    
    for i in range(n_transactions):
        c_idx = rng.integers(0, n_customers)
        cid = customer_ids[c_idx]
        home_district = customer_districts[c_idx]
        base_device = cust_device_map[cid]
        hist_avg = cust_hist_avg[cid]
        acct_age = customer_accounts_age[c_idx]
        
        txn_time = start_time + timedelta(seconds=int(random_offsets[i]))
        is_fraud_scenario = i in fraud_indices
        
        # Determine transaction type
        if is_fraud_scenario:
            # Fraud favors cash-out, send_money, or international
            ttype = rng.choice(["CASH_OUT", "SEND_MONEY", "INTERNATIONAL_PAYMENT", "PAYMENT"], p=[0.45, 0.35, 0.12, 0.08])
        else:
            ttype = rng.choice(TRANSACTION_TYPES, p=TRANSACTION_TYPE_WEIGHTS)
            
        is_international = 1 if ttype == "INTERNATIONAL_PAYMENT" or (is_fraud_scenario and rng.random() < 0.15) else 0
        
        # Normal vs Suspicious features
        if is_fraud_scenario:
            # High amount deviation (4x to 15x normal)
            amount_deviation = round(rng.uniform(4.5, 14.0), 2)
            amount = round(hist_avg * amount_deviation, 2)
            amount = min(amount, 250000.0)
            
            is_new_recipient = 1 if rng.random() < 0.90 else 0
            is_new_device = 1 if rng.random() < 0.85 else 0
            is_new_location = 1 if rng.random() < 0.80 else 0
            velocity_1h = int(rng.integers(3, 12))
            velocity_24h = int(rng.integers(8, 30))
            
            device_id = f"DEV-{rng.integers(100000, 999999):06X}" if is_new_device else base_device
            txn_location = rng.choice([d for d in DISTRICTS if d != home_district]) if is_new_location else home_district
            
            m_risk = "HIGH" if rng.random() < 0.50 else "MEDIUM"
        else:
            # Normal distribution around 1.0x
            amount_deviation = round(max(0.15, float(rng.normal(1.0, 0.35))), 2)
            amount = round(hist_avg * amount_deviation, 2)
            amount = max(50.0, min(amount, 35000.0))
            
            is_new_recipient = 1 if rng.random() < 0.12 else 0
            is_new_device = 1 if rng.random() < 0.04 else 0
            is_new_location = 1 if rng.random() < 0.06 else 0
            velocity_1h = int(rng.choice([0, 1, 2], p=[0.72, 0.22, 0.06]))
            velocity_24h = int(rng.integers(1, 6))
            
            device_id = base_device if not is_new_device else f"DEV-{rng.integers(100000, 999999):06X}"
            txn_location = home_district if not is_new_location else rng.choice(DISTRICTS)
            
            m_risk = "LOW" if rng.random() < 0.82 else "MEDIUM"
            
        # Counterparty assignment
        if ttype == "PAYMENT":
            m_idx = rng.integers(0, n_merchants)
            merchant_id = merchant_ids[m_idx]
            merchant_cat = merchant_cats[m_idx]
            recipient_id = merchant_id
            recipient_type = "MERCHANT"
            m_risk = merchant_risks[m_idx]
        elif ttype in ["CASH_OUT", "CASH_IN"]:
            merchant_id = "N/A"
            merchant_cat = "N/A"
            recipient_id = f"AGT-{rng.integers(1001, 1500)}"
            recipient_type = "AGENT"
        elif ttype == "BILL_PAYMENT":
            merchant_id = "N/A"
            merchant_cat = "UTILITY"
            recipient_id = f"UTIL-{rng.integers(101, 130)}"
            recipient_type = "UTILITY_BILLER"
        elif ttype == "TRANSFER":
            merchant_id = "N/A"
            merchant_cat = "N/A"
            recipient_id = f"BANK-ACC-{rng.integers(10001, 19999)}"
            recipient_type = "BANK"
        else: # SEND_MONEY, INTERNATIONAL_PAYMENT, REFUND, CARD_PAYMENT
            merchant_id = "N/A"
            merchant_cat = "N/A"
            recip_c_idx = rng.integers(0, n_customers)
            recipient_id = customer_ids[recip_c_idx] if not is_new_recipient else f"EXT-U-{rng.integers(50000, 99999)}"
            recipient_type = "CUSTOMER"
            
        # Channel assignment
        if is_international:
            channel = "WEB"
        elif ttype == "CARD_PAYMENT":
            channel = rng.choice(["POS", "WEB", "QR"], p=[0.45, 0.40, 0.15])
        else:
            channel = rng.choice(["APP", "USSD", "QR"], p=[0.70, 0.20, 0.10])
            
        # Consistent balance management
        current_bal = cust_balance[cid]
        if ttype in ["CASH_IN", "REFUND"]:
            balance_before = current_bal
            balance_after = round(current_bal + amount, 2)
            cust_balance[cid] = balance_after
        else:
            # Outgoing txn
            if current_bal < amount:
                # Top up balance so user never has negative balance
                current_bal = round(amount + rng.uniform(500.0, 5000.0), 2)
            balance_before = current_bal
            balance_after = round(current_bal - amount, 2)
            cust_balance[cid] = balance_after
            
        # Ground-truth fraud label formula according to synthetic data assumptions
        m_risk_factor = 1.0 if m_risk == "HIGH" else (0.5 if m_risk == "MEDIUM" else 0.0)
        latent_score = (
            0.25 * min(amount_deviation / 5.0, 2.0)
            + 0.20 * is_new_device
            + 0.15 * is_new_recipient
            + 0.15 * is_new_location
            + 0.15 * min(velocity_1h / 4.0, 1.5)
            + 0.10 * m_risk_factor
            + rng.normal(0.0, 0.04)
        )
        
        fraud_label = 1 if latent_score >= 0.65 else 0
        
        # If explicitly selected for fraud scenario, enforce fraud_label = 1
        if is_fraud_scenario:
            fraud_label = 1
            
        rows.append({
            "transaction_id": f"SYN-TXN-{1000001 + i}",
            "customer_id": cid,
            "timestamp": txn_time.isoformat(),
            "amount_bdt": amount,
            "transaction_type": ttype,
            "merchant_id": merchant_id,
            "merchant_category": merchant_cat,
            "recipient_id": recipient_id,
            "recipient_type": recipient_type,
            "channel": channel,
            "device_id": device_id,
            "location": txn_location,
            "balance_before": balance_before,
            "balance_after": balance_after,
            "is_international": is_international,
            "is_new_recipient": is_new_recipient,
            "is_new_device": is_new_device,
            "is_new_location": is_new_location,
            "velocity_1h": velocity_1h,
            "velocity_24h": velocity_24h,
            "historical_avg_amount": hist_avg,
            "amount_deviation": amount_deviation,
            "fraud_label": fraud_label
        })
        
    df = pd.DataFrame(rows)
    return df
