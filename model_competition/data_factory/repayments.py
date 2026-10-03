"""
Repayment Entity Generator
Generates micro-credit installment payment records.
"""

import numpy as np
import pandas as pd
from datetime import date, timedelta
from data_factory.config import RANDOM_SEED

def generate_repayments(credit_profiles_df: pd.DataFrame, n_repayments: int, seed: int = RANDOM_SEED) -> pd.DataFrame:
    """Generate repayment records reflecting credit profile traits."""
    rng = np.random.default_rng(seed)
    
    # Filter customers with loan history
    borrowers = credit_profiles_df[credit_profiles_df["previous_loan_count"] > 0]
    if borrowers.empty:
        borrowers = credit_profiles_df
        
    cids = borrowers["customer_id"].values
    lates = borrowers["late_payment_count"].values
    risk_labels = borrowers["credit_risk_label"].values
    n_borrowers = len(borrowers)
    
    base_due = date(2025, 6, 1)
    
    rows = []
    for i in range(n_repayments):
        idx = rng.integers(0, n_borrowers)
        cid = cids[idx]
        user_late = lates[idx]
        is_risky = risk_labels[idx]
        
        loan_amount = float(rng.choice([5000.0, 10000.0, 15000.0, 25000.0, 40000.0]))
        installment = round(loan_amount / 4.0, 2)
        
        due_d = base_due + timedelta(days=int(rng.integers(0, 450)))
        
        if is_risky and rng.random() < 0.25:
            # Delinquent or defaulted
            default_flag = 1 if rng.random() < 0.40 else 0
            days_late = int(rng.integers(15, 60))
            if default_flag:
                days_late = int(rng.integers(60, 95))
                repaid = round(float(installment * rng.uniform(0.0, 0.4)), 2)
                pay_d = ""
            else:
                repaid = installment
                pay_d = (due_d + timedelta(days=days_late)).isoformat()
        else:
            default_flag = 0
            days_late = 0 if rng.random() < 0.88 else int(rng.integers(1, 5))
            repaid = installment
            pay_d = (due_d + timedelta(days=days_late)).isoformat()
            
        rows.append({
            "repayment_id": f"SYN-REP-{10001 + i}",
            "customer_id": cid,
            "loan_id": f"SYN-LN-{5001 + (i % 2500)}",
            "loan_amount": loan_amount,
            "installment_amount": installment,
            "due_date": due_d.isoformat(),
            "payment_date": pay_d,
            "days_late": days_late,
            "repaid_amount": repaid,
            "default_flag": default_flag
        })
        
    return pd.DataFrame(rows)
