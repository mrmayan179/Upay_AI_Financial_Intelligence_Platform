"""
Credit Profile Entity Generator
Generates behavioral credit scoring metrics and synthetic credit-readiness target.
"""

import numpy as np
import pandas as pd
from data_factory.config import RANDOM_SEED

def generate_credit_profiles(customers_df: pd.DataFrame, seed: int = RANDOM_SEED) -> pd.DataFrame:
    """Generate credit profiles for all customers."""
    rng = np.random.default_rng(seed)
    
    n = len(customers_df)
    customer_ids = customers_df["customer_id"].values
    incomes = customers_df["monthly_income"].values
    account_ages = customers_df["account_age_days"].values
    occupations = customers_df["occupation_type"].values
    segments = customers_df["customer_segment"].values
    
    avg_inflows = np.zeros(n, dtype=float)
    avg_outflows = np.zeros(n, dtype=float)
    income_consistencies = np.zeros(n, dtype=float)
    balance_stabilities = np.zeros(n, dtype=float)
    cashout_ratios = np.zeros(n, dtype=float)
    txn_frequencies = np.zeros(n, dtype=float)
    prev_loans = np.zeros(n, dtype=int)
    repay_rates = np.zeros(n, dtype=float)
    late_counts = np.zeros(n, dtype=int)
    avg_lates = np.zeros(n, dtype=float)
    labels = np.zeros(n, dtype=int)
    
    for i in range(n):
        inc = incomes[i]
        occ = occupations[i]
        seg = segments[i]
        
        # Monthly inflow is proportional to declared income with small variance
        inflow = round(float(inc * rng.uniform(0.85, 1.15)), 2)
        outflow = round(float(inflow * rng.uniform(0.65, 0.98)), 2)
        
        # Stability and consistency metrics based on occupation & demographic
        if occ in ["SALARIED", "RETIRED"] or seg == "AFFLUENT":
            consistency = rng.uniform(0.70, 0.98)
            stability = rng.uniform(0.55, 0.92)
            cashout = rng.uniform(0.15, 0.50)
            repay = rng.uniform(0.85, 1.0)
            lates = int(rng.choice([0, 1, 2], p=[0.75, 0.20, 0.05]))
            avg_late = float(rng.uniform(0.0, 3.0)) if lates > 0 else 0.0
        elif occ in ["BUSINESS", "SME"]:
            consistency = rng.uniform(0.50, 0.85)
            stability = rng.uniform(0.40, 0.80)
            cashout = rng.uniform(0.25, 0.65)
            repay = rng.uniform(0.70, 0.98)
            lates = int(rng.choice([0, 1, 2, 3], p=[0.55, 0.25, 0.15, 0.05]))
            avg_late = float(rng.uniform(2.0, 8.0)) if lates > 0 else 0.0
        else: # FREELANCER, STUDENT, HOMEMAKER, MASS
            consistency = rng.uniform(0.20, 0.75)
            stability = rng.uniform(0.15, 0.65)
            cashout = rng.uniform(0.40, 0.88)
            repay = rng.uniform(0.50, 0.95)
            lates = int(rng.choice([0, 1, 2, 3, 4], p=[0.40, 0.25, 0.18, 0.12, 0.05]))
            avg_late = float(rng.uniform(3.0, 18.0)) if lates > 0 else 0.0
            
        freq = round(float(rng.uniform(5.0, 65.0)), 1)
        loan_count = int(rng.integers(0, 8))
        
        if loan_count == 0:
            repay = 1.0
            lates = 0
            avg_late = 0.0
            
        # Ground-truth synthetic credit risk target calculation
        latent_risk = (
            0.30 * (1.0 - consistency)
            + 0.25 * (1.0 - stability)
            + 0.20 * cashout
            + 0.25 * min(avg_late / 25.0, 1.0)
            + rng.normal(0.0, 0.05)
        )
        
        # 1 = High Risk (not ready), 0 = Low Risk (credit ready)
        credit_label = 1 if latent_risk >= 0.50 else 0
        
        avg_inflows[i] = inflow
        avg_outflows[i] = outflow
        income_consistencies[i] = round(float(consistency), 4)
        balance_stabilities[i] = round(float(stability), 4)
        cashout_ratios[i] = round(float(cashout), 4)
        txn_frequencies[i] = freq
        prev_loans[i] = loan_count
        repay_rates[i] = round(float(repay), 4)
        late_counts[i] = lates
        avg_lates[i] = round(avg_late, 1)
        labels[i] = credit_label
        
    df = pd.DataFrame({
        "customer_id": customer_ids,
        "avg_monthly_inflow": avg_inflows,
        "avg_monthly_outflow": avg_outflows,
        "income_consistency": income_consistencies,
        "balance_stability": balance_stabilities,
        "cashout_ratio": cashout_ratios,
        "transaction_frequency": txn_frequencies,
        "account_age_days": account_ages,
        "previous_loan_count": prev_loans,
        "previous_repayment_rate": repay_rates,
        "late_payment_count": late_counts,
        "avg_days_late": avg_lates,
        "credit_risk_label": labels
    })
    
    return df
