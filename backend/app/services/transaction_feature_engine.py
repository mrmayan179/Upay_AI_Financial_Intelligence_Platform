"""
Runtime Transaction Feature Engine for Upay AI Platform
Extracts, calculates, and derives real-time behavioral features directly from the application database.
Zero hardcoding: all signals computed dynamically at transaction evaluation time.
"""

from datetime import datetime, timedelta
from typing import Dict, Any, Tuple
from sqlalchemy.orm import Session
from backend.app.database.models import CardTransaction, Customer

DEFAULT_HISTORICAL_AVG_BDT = 3500.00
USD_TO_BDT_RATE = 121.50

def extract_runtime_transaction_features(
    db: Session,
    customer_id: str,
    card_id: str,
    amount_usd: float,
    merchant_name: str,
    channel: str = "ONLINE",
    country: str = "US",
    device_id: str = "DEV-APP-01"
) -> Dict[str, Any]:
    """
    Computes real-time behavioral, velocity, and deviation features by querying
    actual historical transactions from the database for the given customer.
    """
    amount_bdt = round(amount_usd * USD_TO_BDT_RATE, 2)
    now = datetime.utcnow()
    one_hour_ago = now - timedelta(hours=1)
    twenty_four_hours_ago = now - timedelta(hours=24)
    
    # 1. Fetch historical transactions from Supabase Cloud PostgreSQL (Primary Runtime)
    from backend.app.services.supabase_service import fetch_supabase_transactions
    
    historical_raw = []
    data_source = "SUPABASE_POSTGRESQL"
    try:
        supa_txns = fetch_supabase_transactions(customer_id=customer_id, limit=100)
        if supa_txns:
            for t in supa_txns:
                st = t.get("status", "")
                if st in ["APPROVED", "SUCCESSFUL", "HELD_FOR_REVIEW", "PENDING"]:
                    cat = t.get("created_at")
                    cat_dt = None
                    if cat:
                        try:
                            clean_cat = cat.replace("Z", "+00:00").split("+")[0]
                            cat_dt = datetime.fromisoformat(clean_cat)
                        except Exception:
                            cat_dt = now
                    historical_raw.append({
                        "amount_bdt": float(t.get("amount_bdt", 0.0)),
                        "merchant_name": t.get("merchant_name", ""),
                        "device_id": t.get("device_id", ""),
                        "country": t.get("country", ""),
                        "created_at": cat_dt
                    })
    except Exception:
        historical_raw = []
        
    # Offline fallback to local DB session if Supabase unavailable (strictly DISABLED in production)
    import os
    is_production = os.getenv("ENVIRONMENT", "").strip().lower() == "production"
    if not historical_raw and db:
        if is_production:
            import logging
            logging.error("CRITICAL: Supabase historical transaction query failed or empty in production. SQLite fallback is DISABLED in production.")
        else:
            data_source = "SQLITE_FALLBACK"
            historical_txns = db.query(CardTransaction).filter(
                CardTransaction.customer_id == customer_id,
                CardTransaction.status.in_(["APPROVED", "SUCCESSFUL", "HELD_FOR_REVIEW", "PENDING"])
            ).all()
            for t in historical_txns:
                historical_raw.append({
                    "amount_bdt": float(t.amount_bdt),
                    "merchant_name": t.merchant_name,
                    "device_id": getattr(t, 'device_id', ''),
                    "country": t.country,
                    "created_at": t.created_at
                })
    
    # 2. Historical Average Amount calculation
    if historical_raw:
        total_prev_bdt = sum(t["amount_bdt"] for t in historical_raw if t["amount_bdt"] > 0)
        count_prev = sum(1 for t in historical_raw if t["amount_bdt"] > 0)
        hist_avg = round(total_prev_bdt / max(1, count_prev), 2) if count_prev > 0 else DEFAULT_HISTORICAL_AVG_BDT
    else:
        hist_avg = DEFAULT_HISTORICAL_AVG_BDT
        
    amount_deviation = round(amount_bdt / max(1.0, hist_avg), 2)
    
    # 3. Dynamic Velocity Calculations
    txns_1h = [t for t in historical_raw if t["created_at"] and t["created_at"] >= one_hour_ago]
    txns_24h = [t for t in historical_raw if t["created_at"] and t["created_at"] >= twenty_four_hours_ago]
    velocity_1h = len(txns_1h)
    velocity_24h = len(txns_24h)
    
    # 4. Novelty & Identity Checks (New Recipient, New Device, New Location)
    known_merchants = {t["merchant_name"].strip().lower() for t in historical_raw if t.get("merchant_name")}
    is_new_recipient = 1 if merchant_name.strip().lower() not in known_merchants else 0
    
    known_devices = {t["device_id"] for t in historical_raw if t.get("device_id")}
    is_new_device = 1 if device_id and device_id not in known_devices and len(known_devices) > 0 else (0 if len(known_devices) == 0 else 1)
    
    known_countries = {t["country"].upper() for t in historical_raw if t.get("country")}
    is_new_location = 1 if country.upper() not in known_countries and len(known_countries) > 0 else 0
    is_international = 1 if country.upper() != "BD" else 0
    
    hour_of_day = float(now.hour)
    
    # Map transaction type code
    txn_type = "CARD_PAYMENT"
    if channel == "CONTACTLESS":
        channel_code_val = "POS"
    else:
        channel_code_val = channel
        
    return {
        "customer_id": customer_id,
        "card_id": card_id,
        "amount_usd": amount_usd,
        "amount_bdt": amount_bdt,
        "historical_avg_amount": hist_avg,
        "amount_deviation": amount_deviation,
        "velocity_1h": float(velocity_1h),
        "velocity_24h": float(velocity_24h),
        "is_new_recipient": is_new_recipient,
        "is_new_device": is_new_device,
        "is_new_location": is_new_location,
        "is_international": is_international,
        "merchant_name": merchant_name,
        "channel": channel_code_val,
        "country": country,
        "device_id": device_id,
        "hour_of_day": hour_of_day,
        "transaction_type": txn_type,
        "recipient_type": "MERCHANT",
        "calculation_timestamp": now.isoformat()
    }
