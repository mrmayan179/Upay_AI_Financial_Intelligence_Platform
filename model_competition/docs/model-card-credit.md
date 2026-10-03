# Model Card — Credit Readiness Model (Model 3)

## 1. Model Overview
- **Model Name:** Credit Readiness & Risk Classifier
- **Version:** `credit-xgb-1.0.0`
- **Model Type:** Extreme Gradient Boosted Trees (XGBoost Classifier)
- **Objective:** Predicts probability of credit distress / delinquency and estimates customer credit readiness score (0-100).
- **Serving Path:** `POST /api/v1/ml/credit/analyze`

## 2. Regulatory Positioning & Decision Boundary
> **MANDATORY NOTICE:** This model provides AI decision-support and behavioral credit readiness signals. It does **not** grant automatic loan approval or disburse funds. All final lending underwriting decisions and capital allocation reside solely with partner licensed financial institutions (UCB / commercial banks).

## 3. Training & Evaluation Data
- **Training Set:** 8,000 synthetic customer credit profiles (`data/train/credit_train.csv`).
- **Locked Test Set:** 2,000 held-out customer credit profiles (`data/test/credit_test.csv`).
- **High-Risk Class Prevalence:** ~11.0%.
- **Reproducibility:** Random seed `20261003`.

## 4. Input Features
1. `avg_monthly_inflow`: Average monthly inward deposits in BDT
2. `avg_monthly_outflow`: Average monthly outward debits in BDT
3. `income_consistency`: Regularity ratio of salary/earnings (0.0 to 1.0)
4. `balance_stability`: Ratio of maintained average daily wallet balance
5. `cashout_ratio`: Proportion of wallet debits converted to paper cash
6. `transaction_frequency`: Monthly transaction count
7. `account_age_days`: Account longevity
8. `previous_loan_count`: Prior micro-credit facilities availed
9. `previous_repayment_rate`: Historical on-time installment completion rate
10. `late_payment_count`: Prior overdue installment instances
11. `avg_days_late`: Average delay on delinquent installments
12. `outflow_to_inflow_ratio`: Engineered debt-to-income expenditure strain

## 5. Performance Metrics (Evaluated on Locked Test Set)
- **Accuracy:** 94.60%
- **Precision:** 69.42%
- **Recall:** 91.40%
- **F1-Score:** 0.7891
- **ROC-AUC:** 0.9853
- **PR-AUC:** 0.9014
- **Confusion Matrix:** TN=1,690, FP=89, FN=19, TP=202

## 6. Explainability & Output
- **XAI Engine:** SHAP TreeExplainer.
- **Artifacts:**
  - `evidence/confusion_matrix_credit.png`
  - `evidence/roc_curve_credit.png`
  - `evidence/shap_credit_summary.png`
- **Output:** Returns `credit_readiness_score` (0-100), `risk_category` (LOW, MEDIUM, HIGH), `suggested_limit_range_bdt`, positive factors (e.g. steady inflows, high repayment rate), and negative factors (e.g. excessive cashout, past delay).
