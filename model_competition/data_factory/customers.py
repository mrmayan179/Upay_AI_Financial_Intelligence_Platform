"""
Customer Entity Generator
Generates realistic, synthetic Upay customer records with zero real PII.
"""

import numpy as np
import pandas as pd
from data_factory.config import (
    RANDOM_SEED,
    DISTRICTS,
    DISTRICT_WEIGHTS,
    OCCUPATIONS,
    OCCUPATION_WEIGHTS,
    CUSTOMER_SEGMENTS,
    SEGMENT_WEIGHTS,
    REGISTRATION_CHANNELS,
    REG_CHANNEL_WEIGHTS,
    DEVICE_TYPES,
    DEVICE_WEIGHTS,
)

def generate_customers(n: int, seed: int = RANDOM_SEED) -> pd.DataFrame:
    """Generate n synthetic customers."""
    rng = np.random.default_rng(seed)
    
    customer_ids = [f"SYN-U-{10001 + i}" for i in range(n)]
    
    # Age distribution roughly following national adult demographic
    ages = rng.integers(18, 72, size=n)
    
    # Gender distribution (M: 52%, F: 47%, O: 1%)
    genders = rng.choice(["M", "F", "O"], size=n, p=[0.52, 0.47, 0.01])
    
    occupations = rng.choice(OCCUPATIONS, size=n, p=OCCUPATION_WEIGHTS)
    districts = rng.choice(DISTRICTS, size=n, p=DISTRICT_WEIGHTS)
    segments = rng.choice(CUSTOMER_SEGMENTS, size=n, p=SEGMENT_WEIGHTS)
    reg_channels = rng.choice(REGISTRATION_CHANNELS, size=n, p=REG_CHANNEL_WEIGHTS)
    device_types = rng.choice(DEVICE_TYPES, size=n, p=DEVICE_WEIGHTS)
    
    # Account age in days (between 30 days and 6.8 years)
    account_age_days = rng.integers(30, 2500, size=n)
    
    # Monthly Income based on occupation and segment
    monthly_incomes = np.zeros(n, dtype=float)
    for i in range(n):
        occ = occupations[i]
        seg = segments[i]
        
        base_income = 25000.0
        if occ == "SALARIED":
            base_income = rng.normal(48000, 15000)
        elif occ == "BUSINESS":
            base_income = rng.normal(65000, 30000)
        elif occ == "FREELANCER":
            base_income = rng.normal(55000, 22000)
        elif occ == "STUDENT":
            base_income = rng.normal(18000, 6000)
        elif occ == "HOMEMAKER":
            base_income = rng.normal(22000, 8000)
        elif occ == "RETIRED":
            base_income = rng.normal(35000, 12000)
            
        if seg == "AFFLUENT":
            base_income *= 2.2
        elif seg == "SME":
            base_income *= 1.8
        elif seg == "STUDENT":
            base_income *= 0.8
            
        monthly_incomes[i] = round(max(15000.0, float(base_income)), 2)
        
    # Account status: 96% Active, 3% Dormant, 1% Restricted
    account_statuses = rng.choice(["ACTIVE", "DORMANT", "RESTRICTED"], size=n, p=[0.96, 0.03, 0.01])
    
    df = pd.DataFrame({
        "customer_id": customer_ids,
        "age": ages,
        "gender_code": genders,
        "occupation_type": occupations,
        "monthly_income": monthly_incomes,
        "district": districts,
        "account_age_days": account_age_days,
        "registration_channel": reg_channels,
        "device_type": device_types,
        "customer_segment": segments,
        "account_status": account_statuses
    })
    
    return df
