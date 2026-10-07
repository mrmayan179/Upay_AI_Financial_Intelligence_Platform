"""
Supabase Cloud Database & Authentication Service
Primary runtime data gateway for the Upay AI Financial Intelligence Platform.
Connects FastAPI directly to Supabase Cloud PostgreSQL via high-performance PostgREST.
"""

import os
import time
import json
from pathlib import Path
from datetime import datetime
from typing import Dict, Any, List, Optional
import httpx

# Load local environment configuration if not already loaded in environment
def _load_env_file():
    for candidate in [
        Path(__file__).resolve().parent.parent.parent / ".env",
        Path(__file__).resolve().parent.parent.parent.parent / ".env",
    ]:
        if candidate.is_file():
            try:
                with open(candidate, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith("#") and "=" in line:
                            k, v = line.split("=", 1)
                            k, v = k.strip(), v.strip().strip("\"'")
                            if k and k not in os.environ:
                                os.environ[k] = v
            except Exception:
                pass

_load_env_file()

SUPABASE_URL = os.getenv("SUPABASE_URL", "https://cedgwabxochvsycsqdpm.supabase.co").rstrip("/")
SUPABASE_PUBLISHABLE_KEY = os.getenv("SUPABASE_PUBLISHABLE_KEY", "")
SUPABASE_SECRET_KEY = os.getenv("SUPABASE_SECRET_KEY", "")
SUPABASE_JWKS_URL = os.getenv("SUPABASE_JWKS_URL", f"{SUPABASE_URL}/auth/v1/.well-known/jwks.json")


_CACHED_JWKS: Optional[Dict[str, Any]] = None
_JWKS_LAST_FETCH = 0.0

def get_supabase_headers(use_secret: bool = True) -> Dict[str, str]:
    """Returns authenticated headers for Supabase REST API."""
    key = SUPABASE_SECRET_KEY if use_secret else SUPABASE_PUBLISHABLE_KEY
    return {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }

def check_supabase_health() -> Dict[str, Any]:
    """
    Pings Supabase Cloud REST API and JWKS endpoint to verify live connectivity,
    authentication validity, schema tables, and round-trip latency.
    """
    start_time = time.time()
    rest_ok = False
    jwks_ok = False
    rest_status_code = None
    jwks_status_code = None
    table_counts = {}

    try:
        with httpx.Client(timeout=8.0) as client:
            # 1. Ping REST Schema endpoint with Secret Key
            r_rest = client.get(f"{SUPABASE_URL}/rest/v1/", headers=get_supabase_headers(use_secret=True))
            rest_status_code = r_rest.status_code
            if r_rest.status_code == 200:
                rest_ok = True

            # 2. Ping JWKS endpoint
            r_jwks = client.get(SUPABASE_JWKS_URL)
            jwks_status_code = r_jwks.status_code
            if r_jwks.status_code == 200:
                jwks_ok = True

            # 3. Query primary tables count
            for tbl in ["customers", "cards", "card_transactions", "cases", "notifications"]:
                try:
                    h = get_supabase_headers(use_secret=True)
                    h["Prefer"] = "count=exact"
                    r_cnt = client.get(f"{SUPABASE_URL}/rest/v1/{tbl}?select=*", headers=h)
                    if r_cnt.status_code in (200, 206):
                        cr = r_cnt.headers.get("content-range", "")
                        count = cr.split("/")[-1] if "/" in cr else str(len(r_cnt.json()))
                        table_counts[tbl] = int(count)
                except Exception:
                    pass

        latency_ms = round((time.time() - start_time) * 1000, 2)
        is_healthy = rest_ok and jwks_ok

        return {
            "status": "CONNECTED" if is_healthy else "DEGRADED",
            "provider": "Supabase Cloud Database & Auth (Primary Runtime)",
            "project_url": SUPABASE_URL,
            "project_ref": "cedgwabxochvsycsqdpm",
            "rest_api_active": rest_ok,
            "rest_http_status": rest_status_code,
            "jwks_active": jwks_ok,
            "jwks_http_status": jwks_status_code,
            "latency_ms": latency_ms,
            "table_counts": table_counts,
            "total_records_verified": sum(table_counts.values()),
            "connected_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "secret_key_verified": rest_ok,
            "publishable_key_configured": bool(SUPABASE_PUBLISHABLE_KEY)
        }
    except Exception as e:
        latency_ms = round((time.time() - start_time) * 1000, 2)
        return {
            "status": "DISCONNECTED",
            "provider": "Supabase Cloud Database & Auth",
            "project_url": SUPABASE_URL,
            "project_ref": "cedgwabxochvsycsqdpm",
            "rest_api_active": False,
            "jwks_active": False,
            "latency_ms": latency_ms,
            "error": str(e)
        }

def fetch_supabase_jwks() -> Optional[Dict[str, Any]]:
    """Fetches and caches the Supabase JWKS public keys."""
    global _CACHED_JWKS, _JWKS_LAST_FETCH
    now = time.time()
    if _CACHED_JWKS and (now - _JWKS_LAST_FETCH) < 3600:
        return _CACHED_JWKS

    try:
        with httpx.Client(timeout=6.0) as client:
            r = client.get(SUPABASE_JWKS_URL)
            if r.status_code == 200:
                _CACHED_JWKS = r.json()
                _JWKS_LAST_FETCH = now
                return _CACHED_JWKS
    except Exception:
        pass
    return _CACHED_JWKS

# ==============================================================================
# Supabase PostgREST Runtime Data Access Operations
# ==============================================================================

def get_supabase_table_counts() -> Dict[str, int]:
    """Retrieves exact row counts for all 11 tables directly from Supabase Cloud."""
    tables = [
        "customers", "cards", "card_transactions", "complaints", "cases",
        "case_events", "credit_recommendations", "voice_calls",
        "voice_transcripts", "ai_activity_logs", "notifications"
    ]
    counts = {}
    headers = get_supabase_headers(use_secret=True)
    headers["Prefer"] = "count=exact"
    with httpx.Client(timeout=10.0) as client:
        for t in tables:
            try:
                r = client.get(f"{SUPABASE_URL}/rest/v1/{t}?select=*", headers=headers)
                if r.status_code in (200, 206):
                    cr = r.headers.get("content-range", "")
                    count = cr.split("/")[-1] if "/" in cr else str(len(r.json()))
                    counts[t] = int(count)
                else:
                    counts[t] = 0
            except Exception:
                counts[t] = 0
    return counts

def fetch_supabase_customer(customer_id: str) -> Optional[Dict[str, Any]]:
    """Reads customer profile directly from Supabase."""
    headers = get_supabase_headers(use_secret=True)
    with httpx.Client(timeout=6.0) as client:
        r = client.get(f"{SUPABASE_URL}/rest/v1/customers?customer_id=eq.{customer_id}", headers=headers)
        if r.status_code == 200 and r.json():
            return r.json()[0]
    return None

def fetch_supabase_cards(customer_id: str) -> List[Dict[str, Any]]:
    """Reads smart cards for customer directly from Supabase."""
    headers = get_supabase_headers(use_secret=True)
    with httpx.Client(timeout=6.0) as client:
        r = client.get(f"{SUPABASE_URL}/rest/v1/cards?customer_id=eq.{customer_id}&order=created_at.desc", headers=headers)
        if r.status_code == 200:
            return r.json()
    return []

def fetch_supabase_card(card_id: str) -> Optional[Dict[str, Any]]:
    """Reads specific smart card directly from Supabase."""
    headers = get_supabase_headers(use_secret=True)
    with httpx.Client(timeout=6.0) as client:
        r = client.get(f"{SUPABASE_URL}/rest/v1/cards?card_id=eq.{card_id}", headers=headers)
        if r.status_code == 200 and r.json():
            return r.json()[0]
    return None

def update_supabase_card(card_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Updates smart card properties in Supabase."""
    headers = get_supabase_headers(use_secret=True)
    with httpx.Client(timeout=6.0) as client:
        r = client.patch(f"{SUPABASE_URL}/rest/v1/cards?card_id=eq.{card_id}", json=updates, headers=headers)
        if r.status_code == 200 and r.json():
            return r.json()[0]
    return None

def fetch_supabase_transactions(card_id: Optional[str] = None, customer_id: Optional[str] = None, limit: int = 20) -> List[Dict[str, Any]]:
    """Reads card transactions directly from Supabase."""
    headers = get_supabase_headers(use_secret=True)
    query = f"order=created_at.desc&limit={limit}"
    if card_id:
        query = f"card_id=eq.{card_id}&{query}"
    elif customer_id:
        query = f"customer_id=eq.{customer_id}&{query}"
    with httpx.Client(timeout=6.0) as client:
        r = client.get(f"{SUPABASE_URL}/rest/v1/card_transactions?{query}", headers=headers)
        if r.status_code == 200:
            return r.json()
    return []

def insert_supabase_transaction(txn_data: Dict[str, Any]) -> Dict[str, Any]:
    """Persists a new card transaction into Supabase PostgreSQL."""
    headers = get_supabase_headers(use_secret=True)
    with httpx.Client(timeout=6.0) as client:
        r = client.post(f"{SUPABASE_URL}/rest/v1/card_transactions", json=txn_data, headers=headers)
        if r.status_code in (200, 201) and r.json():
            return r.json()[0]
    return txn_data

def fetch_supabase_cases(customer_id: str) -> List[Dict[str, Any]]:
    """Reads active dispute cases from Supabase."""
    headers = get_supabase_headers(use_secret=True)
    with httpx.Client(timeout=6.0) as client:
        r = client.get(f"{SUPABASE_URL}/rest/v1/cases?customer_id=eq.{customer_id}&order=created_at.desc", headers=headers)
        if r.status_code == 200:
            return r.json()
    return []

def fetch_supabase_case_detail(case_id: str) -> Optional[Dict[str, Any]]:
    """Reads case and associated case events timeline from Supabase."""
    headers = get_supabase_headers(use_secret=True)
    with httpx.Client(timeout=6.0) as client:
        r = client.get(f"{SUPABASE_URL}/rest/v1/cases?case_id=eq.{case_id}", headers=headers)
        if r.status_code != 200 or not r.json():
            return None
        case_row = r.json()[0]
        # Fetch timeline events
        r_events = client.get(f"{SUPABASE_URL}/rest/v1/case_events?case_id=eq.{case_id}&order=timestamp.asc", headers=headers)
        events = r_events.json() if r_events.status_code == 200 else []
        case_row["timeline"] = events
        return case_row
    return None

def insert_supabase_complaint_and_case(complaint_data: Dict[str, Any], case_data: Dict[str, Any], event_data: Dict[str, Any]) -> None:
    """Persists complaint, case, and initial timeline event into Supabase."""
    headers = get_supabase_headers(use_secret=True)
    with httpx.Client(timeout=6.0) as client:
        client.post(f"{SUPABASE_URL}/rest/v1/complaints", json=complaint_data, headers=headers)
        client.post(f"{SUPABASE_URL}/rest/v1/cases", json=case_data, headers=headers)
        client.post(f"{SUPABASE_URL}/rest/v1/case_events", json=event_data, headers=headers)

def escalate_supabase_case(case_id: str, event_data: Dict[str, Any]) -> None:
    """Updates case status to ESCALATED and adds timeline event in Supabase."""
    headers = get_supabase_headers(use_secret=True)
    with httpx.Client(timeout=6.0) as client:
        client.patch(
            f"{SUPABASE_URL}/rest/v1/cases?case_id=eq.{case_id}",
            json={"status": "ESCALATED", "escalation_level": 1, "progress_percent": 75},
            headers=headers
        )
        client.post(f"{SUPABASE_URL}/rest/v1/case_events", json=event_data, headers=headers)

def fetch_supabase_credit(customer_id: str) -> Optional[Dict[str, Any]]:
    """Reads credit readiness profile from Supabase."""
    headers = get_supabase_headers(use_secret=True)
    with httpx.Client(timeout=6.0) as client:
        r = client.get(f"{SUPABASE_URL}/rest/v1/credit_recommendations?customer_id=eq.{customer_id}", headers=headers)
        if r.status_code == 200 and r.json():
            return r.json()[0]
    return None

def update_supabase_credit_review(customer_id: str, updates: Dict[str, Any]) -> None:
    """Updates credit review request status in Supabase."""
    headers = get_supabase_headers(use_secret=True)
    with httpx.Client(timeout=6.0) as client:
        client.patch(f"{SUPABASE_URL}/rest/v1/credit_recommendations?customer_id=eq.{customer_id}", json=updates, headers=headers)

def fetch_supabase_notifications(customer_id: str, limit: int = 15) -> List[Dict[str, Any]]:
    """Reads notifications from Supabase."""
    headers = get_supabase_headers(use_secret=True)
    with httpx.Client(timeout=6.0) as client:
        r = client.get(f"{SUPABASE_URL}/rest/v1/notifications?customer_id=eq.{customer_id}&order=created_at.desc&limit={limit}", headers=headers)
        if r.status_code == 200:
            return r.json()
    return []

def insert_supabase_notification(notif_data: Dict[str, Any]) -> None:
    """Inserts a notification into Supabase."""
    headers = get_supabase_headers(use_secret=True)
    with httpx.Client(timeout=5.0) as client:
        client.post(f"{SUPABASE_URL}/rest/v1/notifications", json=notif_data, headers=headers)

def insert_supabase_audit_log(log_data: Dict[str, Any]) -> None:
    """Inserts an AI activity log into Supabase."""
    headers = get_supabase_headers(use_secret=True)
    with httpx.Client(timeout=5.0) as client:
        client.post(f"{SUPABASE_URL}/rest/v1/ai_activity_logs", json=log_data, headers=headers)

def fetch_supabase_audit_logs(component: Optional[str] = None, limit: int = 50) -> List[Dict[str, Any]]:
    """Reads AI activity logs from Supabase."""
    headers = get_supabase_headers(use_secret=True)
    query = f"order=created_at.desc&limit={limit}"
    if component and component != "ALL":
        query = f"component=eq.{component}&{query}"
    with httpx.Client(timeout=6.0) as client:
        r = client.get(f"{SUPABASE_URL}/rest/v1/ai_activity_logs?{query}", headers=headers)
        if r.status_code == 200:
            return r.json()
    return []
