# Model Card — Fraud Risk Model (Model 1)

## 1. Model Overview
- **Model Name:** Fraud Risk Classifier
- **Version:** `fraud-xgb-1.0.0`
- **Model Type:** Extreme Gradient Boosted Trees (XGBoost Classifier)
- **Objective:** Supervised binary classification predicting probability of fraudulent / high-risk MFS transactions.
- **Serving Path:** `POST /api/v1/ml/fraud/analyze`

## 2. Intended Use & Scope
- **Primary Use:** Real-time pre-authorization and near-real-time scoring of financial transactions (Send Money, Cash-Out, Merchant Payment, Transfers).
- **Target Audience:** Upay Risk Operations, Fraud Operations Copilot, Card Security Engine, Voice AI.
- **Out-of-Scope:** Definitive legal determination of crime or automated account seizure without human / operational verification.

## 3. Training & Evaluation Data
- **Training Set:** 40,000 synthetic transaction records (`data/train/transactions_train.csv`).
- **Locked Test Set:** 10,000 held-out synthetic transaction records (`data/test/transactions_test.csv`).
- **Class Balance:** ~5.5% fraud prevalence.
- **Reproducibility:** Random seed `20261003`.

## 4. Input Features
1. `amount_bdt`: Transaction amount in BDT
2. `amount_deviation`: Ratio of amount to customer's historical 30-day average
3. `is_new_recipient`: 1 if counterparty recipient is first time
4. `is_new_device`: 1 if device fingerprint is unrecognized
5. `is_new_location`: 1 if transaction district differs from primary registered district
6. `velocity_1h`: Transaction frequency in past 1 hour
7. `velocity_24h`: Transaction frequency in past 24 hours
8. `historical_avg_amount`: Customer baseline ticket size
9. `is_international`: 1 if cross-border transaction
10. `txn_type_code`: Ordinal code of operation type
11. `channel_code`: Ordinal code of access channel (APP, USSD, QR, etc.)
12. `recipient_type_code`: Ordinal code of recipient classification

## 5. Performance Metrics (Evaluated on Locked Test Set)
- **Accuracy:** 100.00%
- **Precision:** 100.00%
- **Recall:** 100.00%
- **F1-Score:** 1.0000
- **ROC-AUC:** 1.0000
- **PR-AUC:** 1.0000
- **Confusion Matrix:** TN=9,450, FP=0, FN=0, TP=550

## 6. Explainability & Governance
- **XAI Engine:** SHAP TreeExplainer.
- **Artifacts:**
  - `evidence/confusion_matrix_fraud.png`
  - `evidence/roc_curve_fraud.png`
  - `evidence/shap_fraud_summary.png`
- **Output:** Returns top structured reasons for high-risk flags (e.g. amount deviation, velocity spike, new device).
