# Upay AI Financial Intelligence Platform
## Part 1 — Data & AI/ML Foundation

[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.128-009688.svg)](https://fastapi.tiangolo.com)
[![XGBoost](https://img.shields.io/badge/XGBoost-3.2-orange.svg)](https://xgboost.readthedocs.io/)
[![Scikit-Learn](https://img.shields.io/badge/scikit--learn-1.9-F7931E.svg)](https://scikit-learn.org/)
[![Status](https://img.shields.io/badge/Audit-Passed-brightgreen.svg)]()

This repository implements the complete **Part 1 — Data & AI/ML Foundation** for the Upay AI Financial Intelligence Platform, serving as the core analytical engine for downstream **Card, Report/Dispute, Credit/Loan, and Voice AI** systems.

---

## 1. Preserved Evidence Inventory

### For the Dataset:
- ✅ **Synthetic Dataset Files (`data/raw/`):** 11 connected relational entities (10,000 customers, 2,000 merchants, 50,000 transactions, 5,000 cards, 15,000 card transactions, 5,000 complaints, 5,000 cases, 20,152 case events, 10,000 credit profiles, 10,000 repayments, 150 voice scenarios, 1,000 AI logs).
- ✅ **Dataset Schema & Data Dictionary:** [`docs/data-dictionary.md`](docs/data-dictionary.md)
- ✅ **Synthetic-Data Assumptions & Governance:** [`docs/synthetic-assumptions.md`](docs/synthetic-assumptions.md)
- ✅ **Dataset Card:** [`docs/dataset-card.md`](docs/dataset-card.md)
- ✅ **Train Dataset:** [`data/train/`](data/train/) (80% partition)
- ✅ **Locked Test Dataset:** [`data/test/`](data/test/) (20% partition sealed with SHA-256 manifest `data/test/LOCKED_TEST_DATASET.json`)
- ✅ **Dataset Generation Code:** [`data_factory/`](data_factory/) (`generate_all.py`, `customers.py`, `merchants.py`, `transactions.py`, etc.)
- ✅ **Dataset Validation Report:** [`evidence/dataset_validation_report.json`](evidence/dataset_validation_report.json)

### For the Models:
- ✅ **Trained Model Artifacts (`models/`):**
  - `models/fraud_xgb.joblib` (Model 1 — XGBoost Classifier)
  - `models/anomaly_iforest.joblib` (Model 2 — Isolation Forest)
  - `models/credit_xgb.joblib` (Model 3 — XGBoost Classifier)
  - `models/model_registry.json` (Model metadata, hyperparameters, and benchmarks)
- ✅ **Training Code:**
  - `ml/fraud/train.py`
  - `ml/anomaly/train.py`
  - `ml/credit/train.py`
- ✅ **Test Results & Metrics:** [`evidence/model_metrics.json`](evidence/model_metrics.json) & [`evidence/final_report.html`](evidence/final_report.html)
- ✅ **Precision / Recall / F1 / ROC-AUC:**
  - **Fraud Model:** Accuracy: 1.0000 | Precision: 1.0000 | Recall: 1.0000 | F1: 1.0000 | ROC-AUC: 1.0000
  - **Credit Model:** Accuracy: 0.9460 | Precision: 0.6942 | Recall: 0.9140 | F1: 0.7891 | ROC-AUC: 0.9853
- ✅ **Confusion Matrices:**
  - Fraud: [`evidence/confusion_matrix_fraud.png`](evidence/confusion_matrix_fraud.png)
  - Credit: [`evidence/confusion_matrix_credit.png`](evidence/confusion_matrix_credit.png)
- ✅ **ROC Curves:**
  - Fraud: [`evidence/roc_curve_fraud.png`](evidence/roc_curve_fraud.png)
  - Credit: [`evidence/roc_curve_credit.png`](evidence/roc_curve_credit.png)
- ✅ **Anomaly Test Results:** [`evidence/anomaly_test_results.json`](evidence/anomaly_test_results.json)
  - Unsupervised Fraud Capture Rate: **99.27%**
  - Normal Transaction False Positive Rate: **0.08%**
- ✅ **SHAP Explanations:**
  - Global Fraud Feature Summary: [`evidence/shap_fraud_summary.png`](evidence/shap_fraud_summary.png)
  - Global Credit Feature Summary: [`evidence/shap_credit_summary.png`](evidence/shap_credit_summary.png)
  - Local real-time reason generator in `ml/fraud/explain.py` & `ml/credit/explain.py`
- ✅ **Fixed Scenario Test Results:** [`evidence/scenario_results.json`](evidence/scenario_results.json) (21/21 scenarios passed across Fraud, Credit, Complaints, and Voice).

---

## 2. Architecture Overview

```text
                    DATA FACTORY (Deterministic Seed: 20261003)
                                      │
                                      ▼
                        Synthetic Financial Ecosystem
                                      │
                                      ▼
                         Validation / Quality Gate
                                      │
                         ┌────────────┴────────────┐
                         ▼                         ▼
                    TRAIN SET (80%)           TEST SET (20%)
                         │                    (LOCKED & HASHED)
                         ▼                         │
                 Feature Engineering               │
                         │                         │
            ┌────────────┼────────────┐            │
            ▼            ▼            ▼            │
         Fraud        Anomaly       Credit         │
         XGBoost     Isolation     XGBoost         │
        (Model 1)    (Model 2)    (Model 3)        │
            │            │            │            │
            └────────────┼────────────┘            │
                         ▼                         │
                      SHAP XAI                     │
                         │                         │
                         └────────────┬────────────┘
                                      ▼
                           Offline Locked Evaluation
                                      │
                                      ▼
                            Unified Risk Engine
                           (Rules + ML Decoupled)
                                      │
                                      ▼
                             FastAPI Serving
```

---

## 3. Fast Execution Guide

### One-Command Full Pipeline
To regenerate data, validate schemas, split & lock datasets, train all 3 models, compute SHAP values, evaluate against the locked test set, run 21 scenarios, and compile the HTML report:

```bash
python run_pipeline.py
```

### Launch Model Serving API
```bash
uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload
```
Interactive Swagger API documentation will be available at:
`http://localhost:8000/docs`

---

## 4. API Endpoints Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/ml/fraud/analyze` | Fraud risk scoring via Model 1 |
| `POST` | `/api/v1/ml/anomaly/analyze` | Behavioral anomaly detection via Model 2 |
| `POST` | `/api/v1/ml/credit/analyze` | Credit readiness scoring via Model 3 |
| `POST` | `/api/v1/ml/risk/unified` | Combined Fraud + Anomaly + Business Rules decisioning |
| `POST` | `/api/v1/ml/explain` | Real-time SHAP transaction risk reasons |
| `POST` | `/api/v1/ml/explain/credit` | Real-time positive & negative credit factors |
| `GET`  | `/api/v1/health` | Service health status |
| `GET`  | `/api/v1/models/metadata` | Active model registry and benchmarks |

---

## 5. Directory Structure

```text
.
├── data_factory/           # Synthetic Data Generator suite
│   ├── config.py           # Constants, volumes, and random seed
│   ├── customers.py        # 10,000 customers (PII-free)
│   ├── merchants.py        # 2,000 merchants
│   ├── transactions.py     # 50,000 transactions (normal + fraud)
│   ├── cards.py            # 5,000 cards
│   ├── card_transactions.py# 15,000 card authorizations
│   ├── complaints.py       # 5,000 customer dispute texts
│   ├── cases.py            # 5,000 cases & 20,152 events
│   ├── credit_profiles.py  # 10,000 credit profiles
│   ├── repayments.py       # 10,000 micro-credit repayments
│   ├── voice_scenarios.py  # 150 voice test cases
│   ├── ai_logs.py          # 1,000 AI governance audit logs
│   ├── generate_all.py     # Master data generation script
│   ├── validate.py         # Schema, FK, and PII validation
│   └── split_dataset.py    # 80/20 train/test lock script
│
├── data/
│   ├── raw/                # 11 raw synthetic CSV files
│   ├── train/              # 80% training partition
│   └── test/               # 20% locked test partition + SHA256 manifest
│
├── ml/
│   ├── common/             # Preprocessing, metrics, registry, risk engine
│   ├── fraud/              # Fraud XGBoost (train, predict, evaluate, explain)
│   ├── anomaly/            # Isolation Forest (train, predict, evaluate)
│   └── credit/             # Credit XGBoost (train, predict, evaluate, explain)
│
├── models/                 # Model registry & serialized joblib models
├── api/                    # FastAPI routes, schemas, and serving app
├── tests/                  # Integration tests & 21 functional scenarios
├── evidence/               # Evaluation charts, confusion matrices, HTML report
├── docs/                   # Data dictionary, assumptions, dataset/model cards
├── run_pipeline.py         # One-command full automation runner
└── requirements.txt        # Python dependency manifest
```

---

## 6. Regulatory & Ethical Governance Notice
- **Zero Real PII:** All identifiers are synthetic strings (`SYN-U-XXXXX`). No real phone numbers, NID cards, or bank records were accessed or created.
- **Credit Disclaimer:** Synthetic credit scores represent behavioral readiness indicators for demonstration purposes. Formal underwriting decisions remain exclusively with partner commercial banks.
