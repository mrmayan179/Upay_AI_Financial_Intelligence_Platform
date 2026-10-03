# Model Card — Behavioral Anomaly Model (Model 2)

## 1. Model Overview
- **Model Name:** Behavioral Anomaly Detector
- **Version:** `anomaly-iforest-1.0.0`
- **Model Type:** Unsupervised Isolation Forest (`sklearn.ensemble.IsolationForest`)
- **Objective:** Unsupervised isolation of anomalous multidimensional transaction behavior deviating from normal customer habits.
- **Serving Path:** `POST /api/v1/ml/anomaly/analyze`

## 2. Intended Use & Scope
- **Primary Use:** Detecting zero-day fraud patterns, unprecedented spending surges, time-of-day anomalies, and erratic account behavior without requiring ground-truth labels.
- **Role in Platform:** Acts as the unsupervised defense layer in the Unified Risk Engine, complementing Model 1's supervised learning.

## 3. Training & Evaluation Data
- **Training Set:** 40,000 synthetic transaction records (`data/train/transactions_train.csv`).
- **Locked Test Set:** 10,000 held-out synthetic transaction records (`data/test/transactions_test.csv`).
- **Contamination Parameter:** 0.055.
- **Reproducibility:** Random seed `20261003`.

## 4. Input Features
1. `amount_bdt`: Transaction monetary size
2. `amount_deviation`: Spending deviation relative to baseline
3. `velocity_1h`: Transaction frequency within 1 hour
4. `velocity_24h`: Transaction frequency within 24 hours
5. `historical_avg_amount`: Historical baseline spending
6. `is_new_device`: Hardware unfamiliarity
7. `is_new_location`: Geographic displacement
8. `is_international`: Cross-border indicator
9. `hour_of_day`: Circular time of day (0 to 23 hours)

## 5. Performance Metrics (Evaluated on Locked Test Set)
- **Total Test Transactions Evaluated:** 10,000
- **Overall Anomaly Flag Rate:** 5.54% (554 / 10,000)
- **Fraud Capture Rate:** 99.27% (546 of 550 synthetic fraud events captured by unsupervised isolation)
- **Normal Transaction False Positive Rate (FPR):** 0.08% (only 8 normal transactions out of 9,450 flagged)
- **Artifact:** `evidence/anomaly_test_results.json`

## 6. Output & Integration
- Returns normalized `anomaly_score` (0.0 to 1.0), `raw_decision_score`, `anomaly_flag` (True/False), and structured `deviation_factors` (e.g. spending spike, unusual hour).
