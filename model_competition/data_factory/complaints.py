"""
Complaint Entity Generator
Generates realistic customer dispute narratives and operational complaint metadata.
"""

import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from data_factory.config import RANDOM_SEED

SAMPLE_COMPLAINT_TEMPLATES = {
    "PAYMENT": [
        "Money was deducted from my account but the grocery merchant did not receive payment confirmation.",
        "Paid utility electricity bill through app yesterday, but bill status still shows unpaid.",
        "Payment to merchant showed failed on app, but BDT 1,200 deducted from my Upay balance.",
        "Duplicate payment charged for the same restaurant QR transaction.",
        "E-commerce merchant payment processed twice during checkout."
    ],
    "FRAUD": [
        "Unauthorized send money transaction of BDT 15,000 sent from my account at 3:00 AM.",
        "Received a scam call asking for OTP, shortly after BDT 8,500 was transferred out.",
        "Suspicious login notification received from unfamiliar device, someone tried to cash out.",
        "My PIN was compromised and unauthorized funds were transferred to an unknown number.",
        "Phishing message led to account takeover and repeated cash-out attempts."
    ],
    "ACCOUNT": [
        "My account has been temporarily restricted after entering wrong PIN 3 times.",
        "Unable to update my registered primary phone number and email in settings.",
        "App says account dormant even though I received funds two weeks ago.",
        "Biometric fingerprint login is not working on my new Android device.",
        "NID verification pending for more than 48 hours."
    ],
    "CARD": [
        "My virtual dual-currency card was declined while making an international subscription payment.",
        "Card charged USD 45.00 for an online software transaction that I cancelled.",
        "Want to temporarily freeze my physical card due to lost wallet.",
        "International online transaction toggle keeps turning off automatically in settings.",
        "Endorsement limit not updating after submitting updated passport copy."
    ],
    "CASH_OUT": [
        "Agent deducted fee but the cash-out transaction timed out without dispensing cash.",
        "Cash-out fee charged higher than standard 1.4% rate at the agent point.",
        "Agent confirmed cash-out successful on terminal but I did not receive SMS confirmation.",
        "Failed cash out attempt at agent, but funds debited from balance."
    ],
    "TRANSFER": [
        "Fund transfer to my linked commercial bank account failed, money not credited yet.",
        "Accidentally transferred BDT 3,500 to a wrong mobile number.",
        "Bank deposit to Upay wallet via internet banking hasn't reflected after 4 hours.",
        "Inter-wallet transfer delayed during peak evening banking clearing hour."
    ],
    "REFUND": [
        "Merchant initiated refund 5 business days ago, but balance is not credited.",
        "Cancelled e-commerce order refund amount is missing BDT 250 processing fee.",
        "Partial refund received instead of full transaction amount."
    ],
    "TECHNICAL": [
        "Upay mobile app crashes immediately on splash screen after latest update.",
        "SMS OTP is taking over 5 minutes to arrive during login attempt.",
        "Network connection error occurred during transaction processing screen."
    ],
    "OTHER": [
        "Need clarification on loyalty reward cashback points calculation.",
        "Requesting official annual account statement for tax filing purposes.",
        "Inquiry regarding upcoming Eid merchant promo discounts."
    ]
}

def generate_complaints(customers_df: pd.DataFrame, n_complaints: int, seed: int = RANDOM_SEED) -> pd.DataFrame:
    """Generate n synthetic complaints with realistic text and categories."""
    rng = np.random.default_rng(seed)
    
    customer_ids = customers_df["customer_id"].values
    chosen_cids = rng.choice(customer_ids, size=n_complaints, replace=True)
    
    categories = [
        "PAYMENT", "FRAUD", "ACCOUNT", "CARD", "CASH_OUT", "TRANSFER", "REFUND", "TECHNICAL", "OTHER"
    ]
    cat_weights = [0.30, 0.15, 0.12, 0.10, 0.10, 0.08, 0.07, 0.05, 0.03]
    
    chosen_cats = rng.choice(categories, size=n_complaints, p=cat_weights)
    
    start_time = datetime(2026, 1, 1, 0, 0, 0)
    total_seconds = int((datetime(2026, 9, 30, 23, 59, 59) - start_time).total_seconds())
    offsets = np.sort(rng.integers(0, total_seconds, size=n_complaints))
    
    team_mapping = {
        "PAYMENT": "TRANSACTION_OPERATIONS",
        "FRAUD": "FRAUD_INVESTIGATION",
        "ACCOUNT": "DISPUTES",
        "CARD": "CARD_SERVICES",
        "CASH_OUT": "TRANSACTION_OPERATIONS",
        "TRANSFER": "TRANSACTION_OPERATIONS",
        "REFUND": "DISPUTES",
        "TECHNICAL": "TECH_SUPPORT",
        "OTHER": "DISPUTES"
    }
    
    rows = []
    for i in range(n_complaints):
        cid = chosen_cids[i]
        cat = chosen_cats[i]
        c_time = start_time + timedelta(seconds=int(offsets[i]))
        
        # Pick narrative
        template_pool = SAMPLE_COMPLAINT_TEMPLATES[cat]
        narrative = rng.choice(template_pool)
        
        # Priority
        if cat == "FRAUD":
            priority = rng.choice(["HIGH", "CRITICAL"], p=[0.35, 0.65])
            escalated = 1 if rng.random() < 0.60 else 0
        elif cat in ["PAYMENT", "CARD"]:
            priority = rng.choice(["LOW", "MEDIUM", "HIGH"], p=[0.20, 0.55, 0.25])
            escalated = 1 if priority == "HIGH" and rng.random() < 0.35 else 0
        else:
            priority = rng.choice(["LOW", "MEDIUM"], p=[0.70, 0.30])
            escalated = 0
            
        assigned_team = team_mapping[cat]
        resolution_type = rng.choice(
            ["REFUNDED", "EXPLAINED", "UNBLOCK_ACCOUNT", "REVERSED", "DECLINED", "IN_PROGRESS"],
            p=[0.35, 0.30, 0.10, 0.10, 0.05, 0.10]
        )
        
        res_time = int(rng.integers(15, 2880))
        
        rows.append({
            "complaint_id": f"SYN-CMP-{10001 + i}",
            "customer_id": cid,
            "created_at": c_time.isoformat(),
            "complaint_text": narrative,
            "category": cat,
            "priority": priority,
            "assigned_team": assigned_team,
            "initial_status": "RECEIVED",
            "resolution_type": resolution_type,
            "resolution_time_minutes": res_time,
            "escalated": escalated
        })
        
    return pd.DataFrame(rows)
