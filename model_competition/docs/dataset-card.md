# Upay AI Platform — Dataset Card

## 1. Dataset Summary
- **Dataset Name:** Upay AI Platform Synthetic Financial Ecosystem
- **Version:** `v1.0.0`
- **Release Date:** October 2026
- **License / Governance:** Open Academic / Competition Use for Upay AI Hackathon
- **Data Generator:** Deterministic procedural generator (`data_factory/`)
- **Random Seed:** `20261003`

## 2. Dataset Composition & Volume

| Entity | Filename | Record Count | Description | Primary Key |
|---|---|---|---|---|
| Customers | `customers.csv` | 10,000 | User demographics, income, tenure, device types | `customer_id` |
| Merchants | `merchants.csv` | 2,000 | Merchant categories, locations, risk profile | `merchant_id` |
| Transactions | `transactions.csv` | 50,000 | MFS financial transactions with fraud labels | `transaction_id` |
| Cards | `cards.csv` | 5,000 | Dual-currency & prepaid cards, limits | `card_id` |
| Card Transactions | `card_transactions.csv` | 15,000 | Card POS/Online/Cross-border authorizations | `card_transaction_id` |
| Complaints | `complaints.csv` | 5,000 | Customer dispute narratives and categories | `complaint_id` |
| Cases | `cases.csv` | 5,000 | Dispute resolution cases | `case_id` |
| Case Events | `case_events.csv` | 20,152 | Granular event audit timeline | `case_event_id` |
| Credit Profiles | `credit_profiles.csv` | 10,000 | Cash-flow stability and credit risk targets | `customer_id` |
| Repayments | `repayments.csv` | 10,000 | Micro-credit loan installment payment records | `repayment_id` |
| Voice Scenarios | `voice_scenarios.csv` | 150 | Voice AI automated testing scenarios | `scenario_id` |
| AI Logs | `ai_activity_logs.csv` | 1,000 | AI/ML execution traces and latency metrics | `ai_log_id` |

## 3. Data Splits & Cryptographic Locking
- **Train Set (80%):** Stored in `data/train/`. Used exclusively for feature engineering, preprocessing fit, and model training.
- **Locked Test Set (20%):** Stored in `data/test/`. Verified and locked via SHA-256 manifest `data/test/LOCKED_TEST_DATASET.json`.
- **Stratification:** Stratified by class labels (`fraud_label` and `credit_risk_label`) to preserve positive class balance across partitions.

## 4. Privacy & Ethical Considerations
- **No Real PII:** All customer IDs are synthetic hashes (`SYN-U-XXXXX`). No real phone numbers, NID numbers, or addresses are used.
- **Fairness & Bias:** Income and risk metrics are calibrated across diverse geographic districts and occupation groups without arbitrary demographic discrimination.
- **Synthetic Ground Truth:** Labels are simulated behaviorally and must not be interpreted as actual bank credit decisions or confirmed criminal culpability.
