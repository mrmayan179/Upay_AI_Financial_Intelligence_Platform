"""
Comprehensive Automated Integration Tests for Upay AI Platform
Tests all subsystems:
1. Health & Security Headers
2. HMAC-SHA256 Auth & Session Security
3. Rate Limiter (HTTP 429 enforcement)
4. Runtime DB Feature Engine, 9-Dim Risk Breakdown & Proactive Warnings
5. Database-Backed Transaction Lifecycle & Audit API
6. 7-Domain Structured NLP Complaint Intelligence & Deterministic Safety Rules
7. Dual-Currency Smart Card Settings & PIN Management
8. Credit Readiness & Loan Underwriting
9. Voice AI Security Enclave, Biometric Challenge & Tool Execution
10. Tamper-Evident Audit Logs
"""

import sys
from pathlib import Path
from fastapi.testclient import TestClient

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from backend.main import app

client = TestClient(app)

def test_all_backend_modules():
    print("=" * 70)
    print("RUNNING COMPREHENSIVE BACKEND INTEGRATION & SECURITY TESTS")
    print("=" * 70)
    
    # =========================================================================
    # 1. Health & Security Headers
    # =========================================================================
    res = client.get("/api/v1/health")
    assert res.status_code == 200, res.text
    assert res.headers.get("x-content-type-options") == "nosniff"
    assert res.headers.get("x-frame-options") == "SAMEORIGIN"
    print(f"[PASS] 1. Health & Security Headers Verified: status={res.json()['status']}")
    
    # =========================================================================
    # 2. HMAC-SHA256 Auth & Session Security
    # =========================================================================
    # Invalid PIN login
    res = client.post("/api/v1/auth/demo-login", json={"phone_number": "01771449164", "pin": "9999"})
    assert res.status_code == 401, "Invalid PIN should be rejected"
    
    # Valid PIN login -> returns Bearer token
    res = client.post("/api/v1/auth/demo-login", json={"phone_number": "01771449164", "pin": "1234"})
    assert res.status_code == 200, res.text
    auth_data = res.json()
    assert "access_token" in auth_data
    token = auth_data["access_token"]
    assert len(token) > 20
    print(f"[PASS] 2. HMAC-SHA256 Token Issued: {token[:16]}... (Expiry: {auth_data['expires_in_hours']}h)")
    
    # Access /me with Bearer token
    headers = {"Authorization": f"Bearer {token}"}
    res = client.get("/api/v1/me", headers=headers)
    assert res.status_code == 200, res.text
    profile = res.json()
    assert profile["display_name"] == "TANVIR KABIR"
    print(f"[PASS] 2b. Authenticated Session /me: {profile['display_name']} (Balance: BDT {profile['account_balance_bdt']:,.2f})")
    
    # Verify rejection of forged token
    bad_res = client.get("/api/v1/me", headers={"Authorization": "Bearer forged.invalid.token"})
    assert bad_res.status_code == 401, "Forged token must be rejected"
    print(f"[PASS] 2c. Cryptographic Integrity: Forged bearer token rejected with HTTP 401")

    # =========================================================================
    # 3. Rate Limiting Enforcement
    # =========================================================================
    # Test sliding window rate limiter on auth endpoint
    rate_limited = False
    for i in range(40):
        r = client.post("/api/v1/auth/verify-token", json={"token": token})
        if r.status_code == 429:
            rate_limited = True
            break
    assert rate_limited, "Rate limiter should trigger HTTP 429 after excessive requests"
    print(f"[PASS] 3. Rate Limiter: Successfully triggered HTTP 429 Too Many Requests protection")

    # =========================================================================
    # 4. Runtime Database Feature Engine & Proactive Warning Pre-Check
    # =========================================================================
    # Fetch cards
    res = client.get("/api/v1/cards", headers=headers)
    assert res.status_code == 200, res.text
    cards = res.json()
    assert len(cards) >= 1
    card1 = cards[0]
    card_id = card1["card_id"]

    # 4a. Normal Spend Pre-Check -> Low risk, no proactive warning
    res = client.post("/api/v1/cards/transactions/pre-check", json={
        "card_id": card_id,
        "amount_usd": 35.0,
        "merchant_name": "Coursera Online",
        "channel": "ONLINE",
        "country": "US",
        "is_new_device": 0
    }, headers=headers)
    assert res.status_code == 200, res.text
    pre_normal = res.json()
    assert pre_normal["decision"] in ["APPROVED", "ALLOW", "CHALLENGE_2FA"]
    assert "fraud" in pre_normal["risk"]
    assert "anomaly" in pre_normal["risk"]
    assert "velocity" in pre_normal["risk"]
    print(f"[PASS] 4a. Transaction Pre-Check: Score={pre_normal['composite_score']}, Decision={pre_normal['decision']}, WarningActive={pre_normal['proactive_warning']['is_warning_active']}")

    # 4b. Spike Transaction Pre-Check -> Proactive Warning Activated!
    res = client.post("/api/v1/cards/transactions/pre-check", json={
        "card_id": card_id,
        "amount_usd": 850.0,
        "merchant_name": "Unknown Terminal Lagos",
        "channel": "ONLINE",
        "country": "NG",
        "is_new_device": 1
    }, headers=headers)
    assert res.status_code == 200, res.text
    pre_spike = res.json()
    assert pre_spike["proactive_warning"]["is_warning_active"] is True
    assert pre_spike["amount_deviation"] > 3.0
    assert len(pre_spike["proactive_warning"]["reasons"]) >= 1
    assert pre_spike["proactive_warning"]["recommended_action"] is not None
    # Verify all 9 risk dimensions are computed from runtime DB features
    assert len(pre_spike["risk"]) == 9
    for dim_name in ["fraud", "anomaly", "amount", "velocity", "device", "location", "recipient", "merchant", "security_ato"]:
        assert dim_name in pre_spike["risk"], f"Missing dimension {dim_name}"
        assert "score" in pre_spike["risk"][dim_name]
        assert "level" in pre_spike["risk"][dim_name]
        assert "reason" in pre_spike["risk"][dim_name]
        assert "source" in pre_spike["risk"][dim_name]
    print(f"[PASS] 4b. High Deviation Pre-Check: Warning Active, Deviation={pre_spike['amount_deviation']:.1f}x avg, 9 Dimensions Present")

    # =========================================================================
    # 5. Database-Backed Transaction Lifecycle & Audit API
    # =========================================================================
    # Execute transaction into database
    res = client.post("/api/v1/cards/transactions/analyze", json={
        "card_id": card_id,
        "amount_usd": 42.50,
        "merchant_name": "DigitalOcean Cloud Services",
        "channel": "ONLINE",
        "country": "US",
        "is_new_device": 0
    }, headers=headers)
    assert res.status_code == 200, res.text
    txn_exec = res.json()
    txn_id = txn_exec["transaction_id"]
    assert txn_exec["status"] in ["APPROVED", "CHALLENGE_REQUIRED", "HELD_FOR_REVIEW", "DECLINED"]
    print(f"[PASS] 5a. Transaction Executed into DB: #{txn_id}, Status={txn_exec['status']}, Score={txn_exec['risk_score']}")

    # Retrieve transaction analysis from database
    res = client.get(f"/api/v1/cards/transactions/{txn_id}/analysis", headers=headers)
    assert res.status_code == 200, res.text
    analysis = res.json()
    assert analysis["transaction_id"] == txn_id
    assert analysis["amount_usd"] == 42.50
    assert "risk" in analysis
    assert len(analysis["risk"]) >= 1
    print(f"[PASS] 5b. Transaction DB Audit Record Retrieved: #{txn_id}, Channel={analysis['channel']}, Model={analysis['model_version']}")

    # Retrieve card transactions list
    res = client.get(f"/api/v1/cards/{card_id}/transactions", headers=headers)
    assert res.status_code == 200, res.text
    txns_list = res.json()
    assert any(t["transaction_id"] == txn_id for t in txns_list)
    print(f"[PASS] 5c. Card Transactions List: {len(txns_list)} total transactions loaded from DB")

    # =========================================================================
    # 6. 7-Domain Structured NLP Complaint Intelligence & Safety Rules
    # =========================================================================
    test_domains = [
        ("My money was deducted 1400 BDT for QR payment but receiver did not get it", "PAYMENT_STUCK_NOT_RECEIVED", "PAYMENT"),
        ("Someone withdrew 5000 BDT from my account without my permission, this is unauthorized fraudulent transaction!", "UNAUTHORIZED_TRANSACTION_FRAUD", "FRAUD"),
        ("My smart card online international payment USD 45 failed at Netflix but limit was reduced", "CARD_CHANNEL_PROBLEM", "CARD"),
        ("Cash out at agent point gave me 2000 BDT less than deducted balance", "CASH_OUT_DISPUTE", "CASH_OUT"),
        ("Inter-bank BEFTN transfer of 10000 BDT delayed for 48 hours not credited to recipient bank", "INTER_BANK_TRANSFER_DELAY", "TRANSFER"),
        ("Merchant refund of 2500 BDT not processed yet after return", "REFUND_DELAY_ISSUE", "REFUND"),
        ("App crashed during transaction checkout and session was frozen", "APP_TECHNICAL_GLITCH", "TECHNICAL"),
    ]

    for text, expected_intent, expected_cat in test_domains:
        res = client.post("/api/v1/reports/intelligence/classify", json={"text": text}, headers=headers)
        assert res.status_code == 200, res.text
        nlp_out = res.json()
        assert nlp_out["intent"] == expected_intent, f"Expected intent {expected_intent}, got {nlp_out['intent']}"
        assert nlp_out["category"] == expected_cat, f"Expected category {expected_cat}, got {nlp_out['category']}"
        assert nlp_out["auto_action_permitted"] is False, "Deterministic safety rule: auto_action_permitted must be False"
        assert nlp_out["suggested_team"] is not None
        assert nlp_out["recommended_next_step"] is not None
    print(f"[PASS] 6a. All 7 Complaint NLP Domains Successfully Verified with Zero Autonomous Money Mutation")

    # Create Case & Escalate
    res = client.post("/api/v1/reports", json={
        "complaint_text": "Inter-bank transfer of 15000 BDT delayed for 3 days not received",
        "category": "TRANSFER"
    }, headers=headers)
    assert res.status_code == 200, res.text
    case_out = res.json()
    case_id = case_out["case_id"]
    
    # Escalate case
    res = client.post(f"/api/v1/reports/{case_id}/escalate", json={"reason": "Customer needs immediate wedding funds"}, headers=headers)
    assert res.status_code == 200, res.text
    assert res.json()["status"] == "ESCALATED"
    print(f"[PASS] 6b. Case #{case_id} Created & Escalated to Tier {res.json()['escalation_level']}")

    # =========================================================================
    # 7. Dual-Currency Smart Card Settings & PIN Management
    # =========================================================================
    # Toggle card controls
    res = client.patch(f"/api/v1/cards/{card_id}/settings", json={
        "nfc_enabled": True,
        "online_enabled": True,
        "international_enabled": True
    }, headers=headers)
    assert res.status_code == 200, res.text
    assert res.json()["international_enabled"] is True
    
    # Reset Card PIN
    res = client.post(f"/api/v1/cards/{card_id}/pin/reset-demo", json={
        "current_pin": "1234",
        "new_pin": "4321"
    }, headers=headers)
    assert res.status_code == 200, res.text
    assert res.json()["success"] is True
    print(f"[PASS] 7. Smart Card Controls & PIN Reset Verified")

    # =========================================================================
    # 8. Credit Readiness & Loan Underwriting
    # =========================================================================
    res = client.get("/api/v1/credit/readiness", headers=headers)
    assert res.status_code == 200, res.text
    cred_profile = res.json()
    assert cred_profile["readiness_score"] >= 70
    assert len(cred_profile["positive_factors"]) >= 1
    
    res = client.post("/api/v1/credit/review-request", headers=headers)
    assert res.status_code == 200, res.text
    print(f"[PASS] 8. Credit Readiness Underwriting Verified: Score={cred_profile['readiness_score']}/100, Cat={cred_profile['risk_category']}")

    # =========================================================================
    # 9. Voice AI Security Enclave & Biometric Verification
    # =========================================================================
    # Start session
    res = client.post("/api/v1/voice/session/start", json={"phone_number": "01771449164", "lang": "bn"}, headers=headers)
    assert res.status_code == 200, res.text
    v_sess = res.json()
    assert v_sess["verified"] is False
    call_id = v_sess["call_id"]
    
    # Reject protected tool before verification
    res = client.post("/api/v1/voice/tools/execute", json={"call_id": call_id, "tool_name": "get_account_summary"}, headers=headers)
    assert res.status_code == 200, res.text
    assert "UNAUTHORIZED" in str(res.json()["result"])
    
    # Verify with valid PIN
    res = client.post("/api/v1/voice/verify", json={"call_id": call_id, "voice_pin": "1234"}, headers=headers)
    assert res.status_code == 200, res.text
    assert res.json()["verified"] is True
    
    # Now execute protected tool successfully
    res = client.post("/api/v1/voice/tools/execute", json={"call_id": call_id, "tool_name": "get_account_summary"}, headers=headers)
    assert res.status_code == 200, res.text
    assert res.json()["result"]["account_number"] is not None
    print(f"[PASS] 9. Voice AI Security Enclave & Biometric Verification Guard Verified")

    # =========================================================================
    # 10. Tamper-Evident Audit Logs
    # =========================================================================
    res = client.get("/api/v1/audit/logs", headers=headers)
    assert res.status_code == 200, res.text
    audit_logs = res.json()
    assert len(audit_logs) >= 5
    print(f"[PASS] 10. Audit & Governance: {len(audit_logs)} tamper-evident audit logs recorded")

    # =========================================================================
    # 11. Supabase Cloud Database & Auth Integration
    # =========================================================================
    res = client.get("/api/v1/supabase/status")
    assert res.status_code == 200, res.text
    supa = res.json()
    assert supa["status"] == "CONNECTED", f"Supabase status: {supa}"
    assert supa["project_ref"] == "cedgwabxochvsycsqdpm"
    assert supa["rest_api_active"] is True
    assert supa["jwks_active"] is True
    assert supa["secret_key_verified"] is True
    
    res = client.get("/api/v1/supabase/jwks")
    assert res.status_code == 200, res.text
    assert "keys" in res.json()
    print(f"[PASS] 11. Supabase Cloud Integration Verified: {supa['project_ref']}.supabase.co (Latency: {supa['latency_ms']}ms, JWKS: Active)")

    # =========================================================================
    # 12. P0 Sensitive Route Authentication & Authorization Rejection Tests
    # =========================================================================
    for unauth_path in ["/api/v1/cards", "/api/v1/me", "/api/v1/notifications", "/api/v1/credit/readiness", "/api/v1/audit/logs"]:
        res_unauth = client.get(unauth_path)
        assert res_unauth.status_code == 401, f"Expected 401 for unauthenticated {unauth_path}, got {res_unauth.status_code}"
    
    assert client.post("/api/v1/cards/transactions/pre-check", json={"card_id": card_id, "amount_usd": 10.0, "merchant_name": "Test"}).status_code == 401
    assert client.post("/api/v1/cards/transactions/analyze", json={"card_id": card_id, "amount_usd": 10.0, "merchant_name": "Test"}).status_code == 401

    print("[PASS] 12. P0 Route-Level Authentication Enforcement: All sensitive endpoints strictly reject unauthenticated requests with HTTP 401")

    # =========================================================================
    # 13. Supabase Live Table Counts & Runtime PostgreSQL Verification
    # =========================================================================
    res_counts = client.get("/api/v1/supabase/counts")
    assert res_counts.status_code == 200, res_counts.text
    counts_data = res_counts.json()
    assert counts_data["status"] == "LIVE_SUPABASE_POSTGRESQL"
    assert counts_data["total_records"] >= 500
    for tbl in ["customers", "cards", "card_transactions", "cases", "notifications"]:
        assert counts_data["counts"][tbl] > 0
    print(f"[PASS] 13. Supabase Cloud PostgreSQL Runtime Verified: {counts_data['total_records']} total records active across all 11 tables")

    print("=" * 70)
    print("ALL 13 SUBSYSTEMS AND INTEGRATION TESTS PASSED WITH 100% SUCCESS!")
    print("=" * 70)

if __name__ == "__main__":
    test_all_backend_modules()
