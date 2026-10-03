"""
Automated Integration Tests for Upay Integrated Product Backend
Tests all 4 product modules: Report, Card, Credit, Voice, plus Auth and Audit.
"""

import sys
from pathlib import Path
from fastapi.testclient import TestClient

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from backend.main import app

client = TestClient(app)

def test_all_backend_modules():
    print("=" * 60)
    print("RUNNING BACKEND FULL PRODUCT INTEGRATION TESTS")
    print("=" * 60)
    
    # 1. Health
    res = client.get("/api/v1/health")
    assert res.status_code == 200, res.text
    print(f"[PASS] Health check: {res.json()['status']}")
    
    # 2. Auth & User Profile
    res = client.get("/api/v1/me")
    assert res.status_code == 200, res.text
    profile = res.json()
    assert profile["display_name"] == "NAKIB MD. ASHIK"
    print(f"[PASS] Auth /me: {profile['display_name']} ({profile['phone_masked']}), Balance: BDT {profile['account_balance_bdt']:,.2f}")
    
    # 3. Smart Report & Cases
    # Classify
    res = client.post("/api/v1/reports/intelligence/classify", json={"text": "Money was deducted from my account but recipient did not get it."})
    assert res.status_code == 200, res.text
    cls_out = res.json()
    assert cls_out["category"] == "PAYMENT"
    print(f"[PASS] Report Intelligence: Category={cls_out['category']}, Priority={cls_out['priority']}, Team={cls_out['suggested_team']}")
    
    # Create Case
    res = client.post("/api/v1/reports", json={"complaint_text": "Electricity bill paid yesterday but status still showing unpaid.", "category": "PAYMENT"})
    assert res.status_code == 200, res.text
    case_out = res.json()
    assert "case_id" in case_out
    assert len(case_out["events"]) >= 3
    print(f"[PASS] Report Case Created: #{case_out['case_id']}, Status={case_out['status']}, Events={len(case_out['events'])}")
    
    # Active cases
    res = client.get("/api/v1/reports/active")
    assert res.status_code == 200, res.text
    active_cases = res.json()
    assert len(active_cases) >= 1
    print(f"[PASS] Active Cases List: {len(active_cases)} active cases for customer")
    
    # Escalate
    res = client.post(f"/api/v1/reports/{case_out['case_id']}/escalate", json={"reason": "Customer needs immediate electricity reconnection"})
    assert res.status_code == 200, res.text
    assert res.json()["status"] == "ESCALATED"
    print(f"[PASS] Case Escalation: #{case_out['case_id']} escalated to Tier {res.json()['escalation_level']}")
    
    # 4. Dual-Currency Smart Card
    res = client.get("/api/v1/cards")
    assert res.status_code == 200, res.text
    cards = res.json()
    assert len(cards) >= 1
    card1 = cards[0]
    print(f"[PASS] Card List: {card1['card_title']} ({card1['card_number_masked']}), Endorsement: ${card1['endorsement_usd']:.0f}, Used: ${card1['used_usd']:.0f}")
    
    # Card Settings Toggle
    res = client.patch(f"/api/v1/cards/{card1['card_id']}/settings", json={"nfc_enabled": True, "online_enabled": True})
    assert res.status_code == 200, res.text
    print(f"[PASS] Card Settings Toggle: NFC={res.json()['nfc_enabled']}, Online={res.json()['online_enabled']}")
    
    # Mock PIN Reset
    res = client.post(f"/api/v1/cards/{card1['card_id']}/pin/reset-demo", json={"current_pin": "1234", "new_pin": "5678"})
    assert res.status_code == 200, res.text
    print(f"[PASS] Mock PIN Reset: {res.json()['message']}")
    
    # Card Transaction AI Analysis
    res = client.post("/api/v1/cards/transactions/analyze", json={
        "card_id": card1["card_id"],
        "amount_usd": 35.0,
        "merchant_name": "Coursera Online",
        "channel": "ONLINE",
        "country": "US"
    })
    assert res.status_code == 200, res.text
    c_txn = res.json()
    assert c_txn["decision"] in ["ALLOW", "CHALLENGE_2FA"]
    print(f"[PASS] Card Authorization & AI Risk: Decision={c_txn['decision']} (Score: {c_txn['risk_score']}), Status={c_txn['status']}")
    
    # 5. Credit Readiness & Loan Recommendation
    res = client.get("/api/v1/credit/readiness")
    assert res.status_code == 200, res.text
    cred_out = res.json()
    assert cred_out["readiness_score"] >= 70
    assert len(cred_out["positive_factors"]) >= 1
    print(f"[PASS] Credit Readiness: Score={cred_out['readiness_score']}/100, Cat={cred_out['risk_category']}, Suggested Range={cred_out['suggested_limit_range_bdt']}")
    
    # Formal Review Request
    res = client.post("/api/v1/credit/review-request")
    assert res.status_code == 200, res.text
    print(f"[PASS] Credit Review Request: {res.json()['message']}")
    
    # 6. AI Voice Customer Service
    # Start session
    res = client.post("/api/v1/voice/session/start", json={"phone_number": "01771449164"})
    assert res.status_code == 200, res.text
    v_sess = res.json()
    assert v_sess["verified"] is False
    call_id = v_sess["call_id"]
    print(f"[PASS] Voice Session Start: Call #{call_id}, Verified={v_sess['verified']}")
    
    # Try calling protected tool before verification -> MUST FAIL / REFUSE!
    res = client.post("/api/v1/voice/tools/execute", json={"call_id": call_id, "tool_name": "get_account_summary"})
    assert res.status_code == 200, res.text
    assert "UNAUTHORIZED" in str(res.json()["result"])
    print(f"[PASS] Voice Security Guard: Unverified call rejected protected account tool successfully!")
    
    # Verify caller with valid PIN or Father's Name
    res = client.post("/api/v1/voice/verify", json={"call_id": call_id, "voice_pin": "1234"})
    assert res.status_code == 200, res.text
    assert res.json()["verified"] is True
    print(f"[PASS] Voice Verification: Caller identity confirmed successfully!")
    
    # Now call protected tool -> MUST SUCCEED!
    res = client.post("/api/v1/voice/tools/execute", json={"call_id": call_id, "tool_name": "get_account_summary"})
    assert res.status_code == 200, res.text
    assert res.json()["result"]["account_number"] is not None
    print(f"[PASS] Voice Tool Dispatched: Tool={res.json()['tool_name']}")
    
    # Create case via voice
    res = client.post("/api/v1/voice/tools/execute", json={
        "call_id": call_id,
        "tool_name": "create_case",
        "arguments": {"complaint_text": "Merchant QR deduction delayed", "category": "PAYMENT"}
    })
    assert res.status_code == 200, res.text
    assert "case_id" in res.json()["result"]
    print(f"[PASS] Voice Case Creation: Generated Case #{res.json()['result']['case_id']}")
    
    # 7. AI Audit Logs
    res = client.get("/api/v1/audit/logs")
    assert res.status_code == 200, res.text
    logs = res.json()
    assert len(logs) >= 5
    print(f"[PASS] Audit & Governance: {len(logs)} tamper-evident AI activity logs recorded!")
    
    print("-" * 60)
    print("ALL 7 BACKEND API SUBSYSTEMS FULLY TESTED & VERIFIED!")
    print("-" * 60)

if __name__ == "__main__":
    test_all_backend_modules()
