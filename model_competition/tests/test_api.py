"""
Automated Integration Tests for Upay AI FastAPI Server
"""

import sys
from pathlib import Path
from fastapi.testclient import TestClient

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from api.main import app

client = TestClient(app)

def test_api_endpoints():
    print("=" * 60)
    print("RUNNING API INTEGRATION TESTS")
    print("=" * 60)
    
    # 1. Health check
    res = client.get("/api/v1/health")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    print(f"[PASS] GET /api/v1/health -> {res.json()['status']}")
    
    # 2. Model metadata
    res = client.get("/api/v1/models/metadata")
    assert res.status_code == 200, f"Metadata failed: {res.text}"
    models = res.json().get("models", {})
    assert "fraud_risk_xgboost" in models
    assert "credit_readiness_xgboost" in models
    assert "behavioral_anomaly_isolation_forest" in models
    print(f"[PASS] GET /api/v1/models/metadata -> 3 models registered ({list(models.keys())})")
    
    # 3. Fraud analyze endpoint
    txn_sample = {
        "amount_bdt": 2400.0,
        "historical_avg_amount": 1000.0,
        "is_new_recipient": 0,
        "is_new_device": 0,
        "is_new_location": 0,
        "velocity_1h": 1,
        "velocity_24h": 2,
        "is_international": 0,
        "transaction_type": "PAYMENT",
        "channel": "APP",
        "recipient_type": "MERCHANT"
    }
    res = client.post("/api/v1/ml/fraud/analyze", json=txn_sample)
    assert res.status_code == 200, f"Fraud analyze failed: {res.text}"
    fraud_out = res.json()
    assert "fraud_probability" in fraud_out
    assert "risk_score" in fraud_out
    assert "risk_class" in fraud_out
    print(f"[PASS] POST /api/v1/ml/fraud/analyze -> Score: {fraud_out['risk_score']}, Class: {fraud_out['risk_class']}")
    
    # 4. Anomaly analyze endpoint
    res = client.post("/api/v1/ml/anomaly/analyze", json=txn_sample)
    assert res.status_code == 200, f"Anomaly analyze failed: {res.text}"
    anom_out = res.json()
    assert "anomaly_score" in anom_out
    assert "anomaly_flag" in anom_out
    print(f"[PASS] POST /api/v1/ml/anomaly/analyze -> Anomaly Score: {anom_out['anomaly_score']}, Flag: {anom_out['anomaly_flag']}")
    
    # 5. Unified Risk endpoint
    res = client.post("/api/v1/ml/risk/unified", json=txn_sample)
    assert res.status_code == 200, f"Unified risk failed: {res.text}"
    unified_out = res.json()
    assert "decision" in unified_out
    assert "composite_risk_score" in unified_out
    assert "explainability" in unified_out
    print(f"[PASS] POST /api/v1/ml/risk/unified -> Decision: {unified_out['decision']}, Composite Score: {unified_out['composite_risk_score']}")
    
    # 6. Credit analyze endpoint
    credit_sample = {
        "avg_monthly_inflow": 75000.0,
        "avg_monthly_outflow": 48000.0,
        "income_consistency": 0.92,
        "balance_stability": 0.80,
        "cashout_ratio": 0.25,
        "transaction_frequency": 30.0,
        "account_age_days": 900,
        "previous_loan_count": 2,
        "previous_repayment_rate": 1.0,
        "late_payment_count": 0,
        "avg_days_late": 0.0
    }
    res = client.post("/api/v1/ml/credit/analyze", json=credit_sample)
    assert res.status_code == 200, f"Credit analyze failed: {res.text}"
    credit_out = res.json()
    assert "credit_readiness_score" in credit_out
    assert "risk_category" in credit_out
    assert "suggested_limit_range_bdt" in credit_out
    print(f"[PASS] POST /api/v1/ml/credit/analyze -> Readiness: {credit_out['credit_readiness_score']}/100, Range: {credit_out['suggested_limit_range_bdt']}")
    
    # 7. Explainability endpoint
    res = client.post("/api/v1/ml/explain", json={"transaction": txn_sample, "top_k": 3})
    assert res.status_code == 200, f"Explain failed: {res.text}"
    explain_out = res.json()
    assert "top_risk_reasons" in explain_out
    assert "feature_attributions" in explain_out
    print(f"[PASS] POST /api/v1/ml/explain -> Top reasons: {len(explain_out['top_risk_reasons'])}")
    
    # 8. Credit explainability endpoint
    res = client.post("/api/v1/ml/explain/credit", json={"credit_profile": credit_sample, "top_k": 3})
    assert res.status_code == 200, f"Credit explain failed: {res.text}"
    c_explain_out = res.json()
    assert "positive_factors" in c_explain_out
    print(f"[PASS] POST /api/v1/ml/explain/credit -> Positive factors: {c_explain_out['positive_factors']}")
    
    print("-" * 60)
    print("ALL API ENDPOINTS TESTED AND VERIFIED SUCCESSFULLY.")
    print("-" * 60)

if __name__ == "__main__":
    test_api_endpoints()
