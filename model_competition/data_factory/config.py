"""
Configuration & Global Constants for Upay AI Synthetic Data Factory
"""

import os
from pathlib import Path

# Base Paths
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
RAW_DATA_DIR = DATA_DIR / "raw"
PROCESSED_DATA_DIR = DATA_DIR / "processed"
TRAIN_DATA_DIR = DATA_DIR / "train"
TEST_DATA_DIR = DATA_DIR / "test"
EVIDENCE_DIR = BASE_DIR / "evidence"
MODELS_DIR = BASE_DIR / "models"
DOCS_DIR = BASE_DIR / "docs"

# Ensure essential directories exist
for p in [DATA_DIR, RAW_DATA_DIR, PROCESSED_DATA_DIR, TRAIN_DATA_DIR, TEST_DATA_DIR, EVIDENCE_DIR, MODELS_DIR, DOCS_DIR]:
    p.mkdir(parents=True, exist_ok=True)

# Deterministic Seed for 100% Reproducibility
RANDOM_SEED = 20261003

# Version Metadata
DATASET_VERSION = "v1.0.0"
GENERATOR_VERSION = "1.0.0"

# Target Dataset Volumes (Production PoC scale)
VOLUME_CONFIG = {
    "num_customers": 10000,
    "num_transactions": 50000,
    "num_merchants": 2000,
    "num_cards": 5000,
    "num_card_transactions": 15000,
    "num_complaints": 5000,
    "num_cases": 5000,
    "num_credit_profiles": 10000,
    "num_repayments": 10000,
    "num_voice_scenarios": 150,
    "num_ai_logs": 1000,
}

# Administrative Geographies (Districts of Bangladesh)
DISTRICTS = [
    "Dhaka", "Chittagong", "Sylhet", "Rajshahi", "Khulna",
    "Barishal", "Rangpur", "Mymensingh", "Gazipur", "Cumilla",
    "Narayanganj", "Bogura", "Cox's Bazar", "Jessore"
]

DISTRICT_WEIGHTS = [
    0.35, 0.18, 0.08, 0.07, 0.06,
    0.04, 0.04, 0.04, 0.05, 0.04,
    0.02, 0.01, 0.01, 0.01
]

# Demographics & Channels
OCCUPATIONS = ["SALARIED", "BUSINESS", "FREELANCER", "STUDENT", "HOMEMAKER", "RETIRED"]
OCCUPATION_WEIGHTS = [0.42, 0.28, 0.12, 0.10, 0.05, 0.03]

CUSTOMER_SEGMENTS = ["MASS", "AFFLUENT", "STUDENT", "SME", "PAYROLL"]
SEGMENT_WEIGHTS = [0.55, 0.15, 0.12, 0.10, 0.08]

REGISTRATION_CHANNELS = ["APP", "AGENT", "BRANCH", "USSD"]
REG_CHANNEL_WEIGHTS = [0.60, 0.25, 0.10, 0.05]

DEVICE_TYPES = ["ANDROID", "IOS", "FEATURE_PHONE"]
DEVICE_WEIGHTS = [0.82, 0.14, 0.04]

# Merchant Verticals
MERCHANT_CATEGORIES = [
    "GROCERY", "RESTAURANT", "E_COMMERCE", "UTILITY", "TRAVEL", "DIGITAL_SERVICE", "EDUCATION"
]
MERCHANT_CATEGORY_WEIGHTS = [0.30, 0.22, 0.18, 0.12, 0.07, 0.06, 0.05]

# Transaction Types
TRANSACTION_TYPES = [
    "PAYMENT", "SEND_MONEY", "CASH_OUT", "CASH_IN",
    "TRANSFER", "BILL_PAYMENT", "CARD_PAYMENT", "INTERNATIONAL_PAYMENT", "REFUND"
]
TRANSACTION_TYPE_WEIGHTS = [0.32, 0.24, 0.16, 0.12, 0.07, 0.05, 0.02, 0.01, 0.01]

# Split Configuration
TRAIN_RATIO = 0.80
TEST_RATIO = 0.20
