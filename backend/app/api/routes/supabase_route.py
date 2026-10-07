"""
Supabase Cloud Health & Status API Routes
"""

from fastapi import APIRouter, HTTPException
from typing import Dict, Any
from backend.app.services.supabase_service import (
    check_supabase_health, fetch_supabase_jwks, SUPABASE_URL, SUPABASE_JWKS_URL
)

router = APIRouter(prefix="/supabase", tags=["Supabase Cloud Integration"])

@router.get("/status")
def get_supabase_status() -> Dict[str, Any]:
    """
    Returns live connectivity and authentication verification status
    for the connected Supabase Cloud project.
    """
    status = check_supabase_health()
    return status

@router.get("/jwks")
def get_supabase_jwks() -> Dict[str, Any]:
    """
    Returns cached public JWKS keys from the connected Supabase instance.
    """
    jwks = fetch_supabase_jwks()
    if not jwks:
        raise HTTPException(status_code=503, detail="Unable to retrieve JWKS from Supabase Cloud")
    return jwks

@router.post("/ping")
def ping_supabase() -> Dict[str, Any]:
    """
    Forces an immediate ping to Supabase Cloud endpoints.
    """
    return check_supabase_health()

@router.get("/counts")
def get_supabase_counts() -> Dict[str, Any]:
    """
    Returns real-time verified row counts for all 11 tables in Supabase PostgreSQL.
    """
    import time
    from backend.app.services.supabase_service import get_supabase_table_counts
    counts = get_supabase_table_counts()
    return {
        "status": "LIVE_SUPABASE_POSTGRESQL",
        "project_ref": "cedgwabxochvsycsqdpm",
        "counts": counts,
        "total_records": sum(counts.values()),
        "verified_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    }
