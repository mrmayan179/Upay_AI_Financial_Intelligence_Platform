# Synthetic Data Assumptions & Governance Protocol

## 1. Executive Summary & Purpose
This document establishes the statistical modeling rules, behavioral assumptions, and governance framework for generating synthetic data within the **Upay AI Financial Intelligence Platform**. 

In compliance with hackathon regulations:
- **100% Synthetic Data:** No real customer records, real names, Bangladeshi National Identity (NID) numbers, real phone numbers, or active bank account/card numbers are used.
- **Reproducibility Guarantee:** All generators utilize deterministic pseudorandom number seeding (`SEED = 20261003`). Running the pipeline reproduces the identical byte-for-byte dataset.
- **Separation of Data Generation Rules from Machine Learning:** Ground truth labels (`fraud_label`, `credit_risk_label`) are synthesized via explicit behavioral simulation functions. The ML models (XGBoost, Isolation Forest) are trained strictly on observable feature vectors, forcing the models to learn non-linear patterns, interaction terms, and statistical variance rather than trivial rule shortcuts.

---

## 2. PII Protection and Privacy-by-Design
To maintain absolute data safety:
1. **Identifier Masking:** All IDs follow strict synthetic namespaces:
   - Customers: `SYN-U-{10000 + i}`
   - Merchants: `SYN-M-{1000 + i}`
   - Cards: `SYN-CRD-{10000 + i}`
   - Transactions: `SYN-TXN-{1000000 + i}`
2. **Geographical Constraints:** Locations are mapped to real geographic administrative districts of Bangladesh (e.g., Dhaka, Chittagong, Sylhet, Khulna) to allow realistic geographic dispersion and distance anomaly calculation, without referencing specific physical street addresses.
3. **Financial Denominations:** All amounts are denominated in Bangladesh Taka (BDT) and US Dollars (USD) according to typical MFS (Mobile Financial Services) regulatory limits (e.g., Bangladesh Bank MFS guidelines on daily cash-in, cash-out, and P2P transfers).

---

## 3. Transaction Behavior & Fraud Modeling Assumptions

### 3.1 Normal Baseline Transactions (~94% of volume)
A legitimate transaction typically reflects regular habitual spending:
- **Amount:** Centered around the customer's historical mean (`amount_deviation` between 0.3x and 2.5x).
- **Time of Day:** Normal waking hours (07:00 to 23:00) with peak transaction volumes around lunch (12:00 - 14:00) and evening (18:00 - 21:00).
- **Recipient Familiarity:** High proportion (>85%) of transactions go to known recipients (frequent merchants, saved billers, known P2P contacts).
- **Device & Location:** >90% occur from the customer's registered primary device and primary operating district.
- **Velocity:** Normal velocity profile: 0 to 2 transactions per hour; 1 to 5 per 24 hours.

### 3.2 Suspicious / Fraudulent Transaction Archetypes (~6% of volume)
Synthetic fraud patterns are intentionally injected to simulate real-world MFS threat vectors:
1. **Account Takeover (ATO) & Sudden Liquidation:**
   - Transaction initiated from a newly registered device (`is_new_device = 1`).
   - Sudden geographic jump (`is_new_location = 1`).
   - Immediate large transfer or cash-out (`amount_deviation > 5.0x`).
   - Velocity spike immediately following login (`velocity_1h >= 4`).
2. **Social Engineering / Mule Scam:**
   - Urgent transfer to an unverified recipient (`is_new_recipient = 1`).
   - Transaction amount exceeds 80% of available balance.
   - High velocity burst (`velocity_24h` exceeds user's 95th percentile).
3. **MFS Cash-Out Siphoning:**
   - Sequence of rapid cash-out transactions right under standard monitoring thresholds.
   - High `cashout_ratio` combined with newly introduced agent or terminal.
4. **Merchant Compromise / High-Risk Terminal:**
   - Transactions routed through merchants flagged with `risk_profile = HIGH`.

### 3.3 Synthetic Ground-Truth Fraud Rule Engine
The ground truth generator computes a composite latent vulnerability score:

$$\text{latent\_score} = 0.25 \times \min\left(\frac{\text{amount\_deviation}}{5}, 2.0\right) + 0.20 \times \text{is\_new\_device} + 0.15 \times \text{is\_new\_recipient} + 0.15 \times \text{is\_new\_location} + 0.15 \times \min\left(\frac{\text{velocity\_1h}}{4}, 1.5\right) + 0.10 \times \text{merchant\_risk\_factor} + \epsilon$$

Where:
- $\epsilon \sim \mathcal{N}(0, 0.05)$ adds realistic natural noise.
- Ground truth `fraud_label = 1` if $\text{latent\_score} \ge 0.65$; otherwise `0`.

---

## 4. Behavioral Anomaly Modeling Assumptions (Model 2)
Anomalies represent statistical outliers in multidimensional feature space:
- Anomalies include both malicious activity (fraud) and benign unusual behavior (e.g., festival Eid shopping, overseas vacation, sudden emergency medical expense).
- Feature space modeled:
  - `amount_bdt` & `amount_deviation`
  - `velocity_1h` & `velocity_24h`
  - `historical_avg_amount`
  - `hour_of_day` (e.g. 02:00 AM to 05:00 AM spikes)
  - `location_change` & `device_change`
  - `cashout_ratio`
- Isolation Forest algorithm isolates these data points with shallow tree splits without supervision.

---

## 5. Credit Profile & Readiness Assumptions (Model 3)

### 5.1 Disclaimer on Lending Decisions
> **IMPORTANT REGULATORY NOTICE:** The synthetic credit-readiness target does not represent actual Upay, UCB, or central bank underwriting policies. In the complete Upay architecture, the AI system delivers credit risk recommendations and readiness scoring, while the partner regulated financial institution retains sole legal authority for credit underwriting, approval, and capital disbursement.

### 5.2 Behavioral Credit Readiness Factors
A customer's credit score is driven by cash-flow discipline and repayment integrity:
- **Positive Predictors:**
  - High and steady `avg_monthly_inflow` relative to outflow.
  - High `income_consistency` (salaried or steady business deposits).
  - High `balance_stability` (not draining balance to zero immediately upon deposit).
  - High historical `previous_repayment_rate` (>90%).
  - Longer tenure (`account_age_days` > 180 days).
- **Negative Predictors:**
  - Extreme `cashout_ratio` (>80% of all inflows cashed out immediately).
  - Frequent late installments (`late_payment_count` > 2).
  - Extended average delinquency (`avg_days_late` > 15 days).
  - Volatile balance fluctuations.

### 5.3 Synthetic Ground-Truth Credit Target
$$\text{credit\_risk\_latent} = 0.30 \times (1 - \text{income\_consistency}) + 0.25 \times (1 - \text{balance\_stability}) + 0.20 \times \text{cashout\_ratio} + 0.25 \times \min\left(\frac{\text{avg\_days\_late}}{30}, 1.0\right) + \text{noise}$$

If $\text{credit\_risk\_latent} \ge 0.50 \implies \text{credit\_risk\_label} = 1$ (High Risk / Low Readiness), else $0$ (Credit Ready / Low Risk).

---

## 6. Train/Test Separation and Leakage Prevention
1. **Isolated Split:** Data is partitioned chronologically / customer-grouped into **80% Train** and **20% Test**.
2. **Locked Test Partition:** The test directory `data/test/` is write-protected upon generation and is never seen, fitted, or referenced during feature engineering or model parameter tuning.
3. **Target Leakage Safeguard:** Latent score components, rule scores, and future timestamps are never fed as input features to the classifiers.
