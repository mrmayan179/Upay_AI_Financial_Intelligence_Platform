# Upay AI Financial Intelligence Platform

> **An End-to-End, Production-Grade AI Platform for Digital Financial Services (MFS), Dual-Currency Smart Cards, Microcredit Underwriting, Dispute Automation, and AI Voice Customer Care.**
> Built for the Upay AI Hackathon 2026.

---

## 📌 Executive Summary

The **Upay AI Financial Intelligence Platform** is an enterprise-ready, explainable AI ecosystem designed specifically for Mobile Financial Services (MFS) in Bangladesh. Powered by three specialized, offline-validated machine learning models and deterministic business rule guards, the platform bridges the gap between raw statistical inference and human-in-the-loop regulatory compliance.

The platform delivers four mission-critical consumer and operational systems wrapped in an authentic, pixel-perfect **Upay mobile and web experience**:

1. **Smart Report & Case Management** — Automated NLP dispute categorization, severity prioritization, structured event timelines, and human supervisor escalation.
2. **Dual-Currency Smart Card + AI Security** — 3D interactive virtual card, Bangladesh Bank passport USD endorsement quota tracking, granular security controls, PIN reset, and real-time sub-50ms fraud and behavioral anomaly authorization.
3. **AI Credit Readiness & Loan Recommendation** — Transparent credit-readiness scoring (0–100), TreeSHAP positive/negative factor attribution, suggested loan ranges, and formal bank review handoff with strict non-autonomous approval disclaimers.
4. **AI Voice Customer Service** — Real-time conversational agent with least-privileged tool execution, multi-challenge caller identity verification, live Bengali/English speech synthesis, and supervisor escalation.
5. **AI Governance & Observability Feed** — Immutable, tamper-evident audit logs capturing live model versions, execution latency, scrubbed feature vectors, and human-intervention flags.

---

## 🏗️ Architectural Topology

```text
                               ┌────────────────────────────────────────────────────────┐
                               │             UPAY CLIENT APPLICATION (VITE + REACT)    │
                               │   • Authentic Mobile App Frame (Hind Siliguri UI)      │
                               │   • Widescreen Platform Dashboard (Judge Evaluation)   │
                               │   • 3D Flip Card, BANGLA QR, Upay Chaka, PIN Pad       │
                               └───────────────────────────┬────────────────────────────┘
                                                           │ JSON over HTTP REST
                                                           ▼
                               ┌────────────────────────────────────────────────────────┐
                               │           FASTAPI ENTERPRISE API GATEWAY (/api/v1)     │
                               │   • Authentication & Demo Profile Management           │
                               │   • Dynamic Case Engine & Audit Logger                 │
                               │   • Voice Agent State Machine & Safety Rules           │
                               └──────────────┬───────────────────────────┬─────────────┘
                                              │                           │
                   ┌──────────────────────────┴───────────┐               ▼
                   ▼                                      ▼      ┌──────────────────────┐
       ┌────────────────────────┐             ┌────────────────┐ │  SQLITE / POSTGRESQL │
       │  MODEL INFERENCE LAYER │             │ GOVERNANCE BUS │ │  • Customers, Cards  │
       │  • adapters.py         │             │ • audit_service│ │  • Cases, Events     │
       │  • Sub-50ms execution  │             │ • SHA-256 Logs │ │  • Credit, Calls     │
       └───────────┬────────────┘             └────────────────┘ └──────────────────────┘
                   │
    ┌──────────────┼──────────────┐
    ▼              ▼              ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  MODEL 1     │ │  MODEL 2     │ │  MODEL 3     │
│  Fraud Risk  │ │  Behavioral  │ │  Credit      │
│  Classifier  │ │  Anomaly     │ │  Readiness   │
│  (XGBoost)   │ │  (IForest)   │ │  (XGBoost)   │
└──────────────┘ └──────────────┘ └──────────────┘
```

---

## 🎨 Authentic Upay Design System

The frontend faithfully replicates Upay's official visual brand and mobile layout guidelines:

- **Bengali Typography**: Native font rendering via Google Fonts `Hind Siliguri` (bold 700/800 headings, 400/500 body) with `Inter` for digits and English monospace codes.
- **Brand Colors**: 
  - Primary Yellow: `#FFC820` / `#FFB800`
  - Primary Blue: `#0047BA`
  - Deep Navy: `#002C6C`
  - Pill Cream: `#FFF6D1`
- **Dynamic Splash Screen**: Vector illustration with an animated continuous blue swoosh curve, pulsing endpoint dot, and the authentic Upay meeting-figures emblem with bold Bengali wordmark (`উপায়`).
- **Mobile Status Bar**: Live device clock, Telegram icon, 4G/4G+ signal indicators, and 31% battery capsule.
- **Profile Header**: User avatar badge, `NAKIB MD. ASHIK` (`01771449164`), toggleable "ব্যালেন্স" capsule button (`৳ ৭.২৫`), and notification bell.
- **Primary 4-Column Service Grid**: Send Money, Mobile Recharge, Cash Out, Pay Bill, Add Money, Savings, Fund Transfer, Request Money, Make Payment, Refer & Earn, NPSB, and AI Audit.
- **Upay Payment Grid**: Traffic Fine, Toll Payment, Govt. Payment, Education, NGO, Insurance, Donation, Zakat.
- **Interactive Micro-Features**:
  - Animated spinning **"উপায় চাকা"** (spinning reward badge) with instant spin modal.
  - Floating action pills for **"উপায় কার্ড"** and **"উপায় অফার"**.
  - **BANGLA QR**: Center-elevated bottom navigation button opening an interoperable QR viewfinder simulator with instant risk check.
  - 4-Dot **PIN Keypad Sheet** for high-risk operations and PIN change.
  - **Balance Breakdown Sheet** dividing main balance and cash reward reserves.

---

## 🤖 Machine Learning Model Specifications

The production platform bundles 3 frozen, immutable machine learning models trained on 100% synthetic financial data (reproducible from Part 1 repository `F:\model for hackathon compitition`):

| Model Name | Algorithm | Task & Functionality | Key Evaluation Metrics |
| :--- | :--- | :--- | :--- |
| **Transaction Fraud Risk** | XGBoost Classifier (`fraud_xgb.joblib`) | Predicts transaction fraud probability and classifies transactions into LOW, MEDIUM, or HIGH risk. | **F1-Score: 1.0000**<br>**ROC-AUC: 1.0000** |
| **Behavioral Anomaly** | Isolation Forest (`anomaly_iforest.joblib`) | Unsupervised out-of-distribution detection across velocity, device drift, and unusual transaction spikes. | **Anomaly Capture: 99.27%**<br>**False Positive: 0.08%** |
| **Credit Readiness** | XGBoost Classifier (`credit_xgb.joblib`) | Evaluates borrower repayment capacity and default likelihood for microcredit recommendation. | **ROC-AUC: 0.9853**<br>**Accuracy: 95.83%** |

### Explainability (XAI)
Every credit and fraud inference generates human-interpretable feature contribution vectors using **TreeSHAP**:
- **Positive Factors**: e.g., Low debt-to-income ratio, steady utility payment history, long account tenure.
- **Negative Factors**: e.g., High transaction velocity, recent cash-out spikes, low average balance.

---

## 🚀 Quick Start Guide

### Prerequisites
- **Python 3.10+** (Python 3.11 recommended)
- **Node.js 18+** & **npm**
- **Git**

### Option A: Windows One-Click Launcher (Recommended)
Double-click `start_platform.bat` or run:
```cmd
start_platform.bat
```
This automatically verifies AI model files, seeds the demo database, launches the FastAPI backend on port 8000, launches the Vite React frontend on port 5173, and opens your default browser.

---

### Option B: Manual Step-by-Step Launch

#### 1. Backend Service
```bash
# In the project root (F:\full project of hackathon)
pip install -r requirements.txt

# Seed the demo database (SQLite)
python backend/seed_data.py

# Launch FastAPI server
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```
- API Base: `http://127.0.0.1:8000`
- Interactive OpenAPI Docs: `http://127.0.0.1:8000/docs`

#### 2. Frontend Application
```bash
# Navigate to frontend folder
cd frontend

# Install dependencies (use npm.cmd on Windows)
npm install

# Start Vite dev server
npm run dev
```
- Web Application: `http://127.0.0.1:5173`

---

### Option C: Docker Deployment
```bash
docker-compose up --build
```
- Frontend UI: `http://localhost:3000`
- Backend API: `http://localhost:8000`

---

## 🧪 Automated Verification & Testing

The repository includes a comprehensive test suite testing all 7 core platform subsystems:
```bash
python -m pytest tests/test_backend_api.py -v
```
**Test Coverage Includes:**
- `test_health_and_model_registry`: Verifies active status of all 3 ML models and registry integrity.
- `test_demo_authentication`: Tests demo login and user profile retrieval.
- `test_report_classification_and_creation`: Tests NLP dispute categorization and timeline progression.
- `test_card_management_and_ai_risk_analyzer`: Tests USD passport quota management and real-time fraud scoring.
- `test_credit_readiness_and_shap_factors`: Tests credit score generation, SHAP explanations, and bank review requests.
- `test_voice_session_and_tool_execution`: Tests caller identity challenge and least-privileged account tools.
- `test_audit_logging`: Verifies sub-50ms latency logs and audit trace persistence.

To test the frontend build:
```bash
cd frontend
npm run build
```

---

## 👤 Demo Persona & Test Credentials

For hackathon presentation and live evaluation, the system is pre-configured with a realistic demo persona:

| Attribute | Value |
| :--- | :--- |
| **Customer Name** | `NAKIB MD. ASHIK` |
| **Phone Number** | `01771449164` |
| **Demo PIN** | `1234` |
| **Customer ID** | `SYN-U-10082` |
| **Upay Account Balance** | `BDT 7.25` |
| **Cash Reward Reserve** | `BDT 25.00` |
| **Primary Smart Card** | Upay Platinum Dual-Currency (`4000 1234 5678 9010`) |
| **USD Endorsement Quota**| `$5,000.00` total / `$3,820.00` remaining |

---

## 📁 Repository Directory Structure

```text
F:\full project of hackathon\
├── ai_models\                       # Frozen Production ML Artifacts & Registry
│   ├── fraud_xgb.joblib             # Model 1: Fraud Classifier
│   ├── anomaly_iforest.joblib       # Model 2: Anomaly Detector
│   ├── credit_xgb.joblib            # Model 3: Credit Scorer
│   ├── model_registry.json          # Cryptographic Manifest & Versions
│   └── inference\
│       └── adapters.py              # Sub-50ms Scikit-Learn/XGBoost Ingest Adapters
├── backend\                         # FastAPI High-Performance Backend
│   ├── main.py                      # Application Gateway & CORS Router
│   ├── seed_data.py                 # SQLite/PostgreSQL Database Seeder
│   ├── app\
│   │   ├── api\routes\              # Modular REST Endpoints
│   │   │   ├── auth.py              # Profile, Login, Notifications
│   │   │   ├── cards.py             # Smart Card & AI Risk Engine
│   │   │   ├── credit.py            # Credit Readiness & Bank Handoff
│   │   │   ├── reports.py           # NLP Dispute & Timeline Engine
│   │   │   ├── voice.py             # 24/7 Voice AI Session & Tool Bus
│   │   │   ├── audit.py             # Governance & Observability Feed
│   │   │   └── health.py            # System Health & Model Diagnostics
│   │   ├── database\
│   │   │   ├── connection.py        # SQLAlchemy Connection Factory
│   │   │   └── models.py            # Normalized Database Schema (10 Tables)
│   │   ├── schemas\
│   │   │   └── payloads.py          # Pydantic Input/Output Schemas
│   │   └── services\                # Business Logic & Deterministic Safeguards
│   │       ├── card_service.py
│   │       ├── credit_service.py
│   │       ├── report_service.py
│   │       ├── voice_service.py
│   │       └── audit_service.py
├── frontend\                        # Modern React 18 + Vite + Tailwind CSS
│   ├── public\
│   │   └── upay_logo.png            # High-Resolution Upay Emblem
│   ├── src\
│   │   ├── components\
│   │   │   ├── layout\              # Shell (Mobile Frame vs Widescreen Switcher)
│   │   │   ├── modules\
│   │   │   │   ├── splash\          # Dynamic Swoosh Animated Splash
│   │   │   │   ├── home\            # Authentic Home Dashboard & Service Grids
│   │   │   │   ├── card\            # 3D Flip Card & AI Risk Simulator
│   │   │   │   ├── report\          # Dispute Classifier & Case Timeline
│   │   │   │   ├── credit\          # Readiness Score Dial & SHAP Waterfall
│   │   │   │   ├── voice\           # Voice Agent & Tool Execution Console
│   │   │   │   └── audit\           # Real-Time Decision Observability Feed
│   │   │   └── shared\              # PIN Pad, Balance Sheet, BANGLA QR Modals
│   │   ├── services\api.ts          # Typed REST API Client
│   │   └── types\index.ts           # Shared TypeScript Data Interfaces
├── tests\                           # Integration Test Suite
│   └── test_backend_api.py          # Pytest Automated Test Runner
├── docker-compose.yml               # Container Orchestration
├── Dockerfile.backend               # Backend Container Definition
├── start_platform.bat               # Windows 1-Click Launch Script
├── LICENSE                          # MIT Open Source License
└── README.md                        # Documentation
```

---

## ⚖️ Regulatory Compliance & Responsible AI Disclaimers

1. **Non-Autonomous Loan Approval**: The AI Credit Readiness score is an analytical readiness indicator and **does not constitute a finalized loan approval**. Under Bangladesh Bank microfinance and digital lending guidelines, final credit underwriting and disbursement decisions remain strictly with licensed partner commercial banks and microfinance institutions.
2. **Deterministic Business Rules Separation**: In adherence to hackathon architectural requirements, machine learning risk probability outputs are strictly decoupled from operational business decisions. Hard limits (such as USD passport endorsement ceilings, frozen card statuses, and PIN requirements) are enforced by deterministic rules that cannot be overridden by ML models.
3. **Synthetic Data Policy**: All data displayed and utilized within this demonstration repository is 100% synthetically generated. No genuine customer Personally Identifiable Information (PII) or proprietary Upay production records were utilized.
4. **Caller Identity Protection**: The AI Voice Agent enforces a mandatory security verification challenge before granting access to least-privileged account tools (e.g. balance check, card freeze). Tool execution is audited and bounded by explicit permissions.

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for complete details.

Copyright (c) 2026 Upay AI Platform Contributors.
