"""
Master Synthetic Data Generator
Generates the complete synthetic financial data ecosystem for Upay AI Platform.
"""

import sys
import os
import time
from pathlib import Path
import pandas as pd

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from data_factory.config import (
    RAW_DATA_DIR,
    VOLUME_CONFIG,
    RANDOM_SEED,
    DATASET_VERSION,
    GENERATOR_VERSION
)
from data_factory.customers import generate_customers
from data_factory.merchants import generate_merchants
from data_factory.transactions import generate_transactions
from data_factory.cards import generate_cards
from data_factory.card_transactions import generate_card_transactions
from data_factory.complaints import generate_complaints
from data_factory.cases import generate_cases_and_events
from data_factory.credit_profiles import generate_credit_profiles
from data_factory.repayments import generate_repayments
from data_factory.voice_scenarios import generate_voice_scenarios
from data_factory.ai_logs import generate_ai_logs

def generate_all():
    print("=" * 60)
    print(f"UPAY AI SYNTHETIC DATA FACTORY — {DATASET_VERSION}")
    print(f"Random Seed: {RANDOM_SEED} (Deterministic Reproducibility)")
    print("=" * 60)
    
    start_total = time.time()
    
    # 1. Customers
    t0 = time.time()
    print("[1/10] Generating customers...", end="", flush=True)
    customers_df = generate_customers(VOLUME_CONFIG["num_customers"], seed=RANDOM_SEED)
    customers_df.to_csv(RAW_DATA_DIR / "customers.csv", index=False)
    print(f" Done ({len(customers_df):,} rows, {time.time()-t0:.2f}s)")
    
    # 2. Merchants
    t0 = time.time()
    print("[2/10] Generating merchants...", end="", flush=True)
    merchants_df = generate_merchants(VOLUME_CONFIG["num_merchants"], seed=RANDOM_SEED)
    merchants_df.to_csv(RAW_DATA_DIR / "merchants.csv", index=False)
    print(f" Done ({len(merchants_df):,} rows, {time.time()-t0:.2f}s)")
    
    # 3. Transactions
    t0 = time.time()
    print("[3/10] Generating transactions & fraud patterns...", end="", flush=True)
    transactions_df = generate_transactions(customers_df, merchants_df, VOLUME_CONFIG["num_transactions"], seed=RANDOM_SEED)
    transactions_df.to_csv(RAW_DATA_DIR / "transactions.csv", index=False)
    fraud_rate = transactions_df["fraud_label"].mean() * 100
    print(f" Done ({len(transactions_df):,} rows, fraud rate: {fraud_rate:.2f}%, {time.time()-t0:.2f}s)")
    
    # 4. Cards
    t0 = time.time()
    print("[4/10] Generating cards...", end="", flush=True)
    cards_df = generate_cards(customers_df, VOLUME_CONFIG["num_cards"], seed=RANDOM_SEED)
    cards_df.to_csv(RAW_DATA_DIR / "cards.csv", index=False)
    print(f" Done ({len(cards_df):,} rows, {time.time()-t0:.2f}s)")
    
    # 5. Card Transactions
    t0 = time.time()
    print("[5/10] Generating card transactions...", end="", flush=True)
    card_txns_df = generate_card_transactions(cards_df, VOLUME_CONFIG["num_card_transactions"], seed=RANDOM_SEED)
    card_txns_df.to_csv(RAW_DATA_DIR / "card_transactions.csv", index=False)
    print(f" Done ({len(card_txns_df):,} rows, {time.time()-t0:.2f}s)")
    
    # 6. Complaints
    t0 = time.time()
    print("[6/10] Generating customer complaints...", end="", flush=True)
    complaints_df = generate_complaints(customers_df, VOLUME_CONFIG["num_complaints"], seed=RANDOM_SEED)
    complaints_df.to_csv(RAW_DATA_DIR / "complaints.csv", index=False)
    print(f" Done ({len(complaints_df):,} rows, {time.time()-t0:.2f}s)")
    
    # 7. Cases & Events
    t0 = time.time()
    print("[7/10] Generating dispute cases & event timelines...", end="", flush=True)
    cases_df, events_df = generate_cases_and_events(complaints_df, seed=RANDOM_SEED)
    cases_df.to_csv(RAW_DATA_DIR / "cases.csv", index=False)
    events_df.to_csv(RAW_DATA_DIR / "case_events.csv", index=False)
    print(f" Done ({len(cases_df):,} cases, {len(events_df):,} events, {time.time()-t0:.2f}s)")
    
    # 8. Credit Profiles
    t0 = time.time()
    print("[8/10] Generating credit profiles...", end="", flush=True)
    credit_df = generate_credit_profiles(customers_df, seed=RANDOM_SEED)
    credit_df.to_csv(RAW_DATA_DIR / "credit_profiles.csv", index=False)
    high_risk_rate = credit_df["credit_risk_label"].mean() * 100
    print(f" Done ({len(credit_df):,} rows, high risk rate: {high_risk_rate:.2f}%, {time.time()-t0:.2f}s)")
    
    # 9. Repayments
    t0 = time.time()
    print("[9/10] Generating micro-loan repayments...", end="", flush=True)
    repayments_df = generate_repayments(credit_df, VOLUME_CONFIG["num_repayments"], seed=RANDOM_SEED)
    repayments_df.to_csv(RAW_DATA_DIR / "repayments.csv", index=False)
    print(f" Done ({len(repayments_df):,} rows, {time.time()-t0:.2f}s)")
    
    # 10. Voice Scenarios & AI Activity Logs
    t0 = time.time()
    print("[10/10] Generating voice scenarios & AI governance logs...", end="", flush=True)
    voice_df = generate_voice_scenarios(customers_df, VOLUME_CONFIG["num_voice_scenarios"], seed=RANDOM_SEED)
    voice_df.to_csv(RAW_DATA_DIR / "voice_scenarios.csv", index=False)
    
    ai_logs_df = generate_ai_logs(customers_df, VOLUME_CONFIG["num_ai_logs"], seed=RANDOM_SEED)
    ai_logs_df.to_csv(RAW_DATA_DIR / "ai_activity_logs.csv", index=False)
    print(f" Done ({len(voice_df):,} voice scenarios, {len(ai_logs_df):,} AI logs, {time.time()-t0:.2f}s)")
    
    total_elapsed = time.time() - start_total
    print("-" * 60)
    print(f"SUCCESS: All 11 synthetic datasets generated in {total_elapsed:.2f}s.")
    print(f"Raw storage location: {RAW_DATA_DIR}")
    print("-" * 60)

if __name__ == "__main__":
    generate_all()
