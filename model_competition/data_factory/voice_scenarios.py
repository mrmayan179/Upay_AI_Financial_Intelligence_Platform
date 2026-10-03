"""
Voice AI Test Scenario Generator
Generates reproducible test harnesses for downstream Voice AI workflows.
"""

import numpy as np
import pandas as pd
from data_factory.config import RANDOM_SEED

VOICE_INTENTS = [
    {
        "intent": "BALANCE_INQUIRY",
        "verification_required": 1,
        "expected_tool": "get_balance",
        "should_escalate": 0,
        "expected_result": "Provide current wallet BDT balance after 2FA verification."
    },
    {
        "intent": "PAYMENT_STUCK",
        "verification_required": 1,
        "expected_tool": "get_transaction",
        "should_escalate": 0,
        "expected_result": "Retrieve recent transaction status and initiate auto-investigation if pending."
    },
    {
        "intent": "COMPLEX_FRAUD",
        "verification_required": 1,
        "expected_tool": "create_case",
        "should_escalate": 1,
        "expected_result": "Create immediate critical fraud dispute case and bridge caller to fraud specialist."
    },
    {
        "intent": "CARD_BLOCK_REQUEST",
        "verification_required": 1,
        "expected_tool": "freeze_card",
        "should_escalate": 0,
        "expected_result": "Instantly change card status to FROZEN and send security SMS."
    },
    {
        "intent": "LIMIT_CHANGE",
        "verification_required": 1,
        "expected_tool": "get_balance",
        "should_escalate": 0,
        "expected_result": "Explain passport endorsement quota status and provide upload link."
    },
    {
        "intent": "TRANSACTION_HISTORY",
        "verification_required": 1,
        "expected_tool": "get_transaction",
        "should_escalate": 0,
        "expected_result": "List last 3 completed transactions with amount and recipient."
    },
    {
        "intent": "DISPUTE_STATUS",
        "verification_required": 1,
        "expected_tool": "get_dispute_status",
        "should_escalate": 0,
        "expected_result": "Query open case progress percent and estimated resolution timeline."
    }
]

def generate_voice_scenarios(customers_df: pd.DataFrame, n_scenarios: int = 150, seed: int = RANDOM_SEED) -> pd.DataFrame:
    """Generate n structured voice test scenarios."""
    rng = np.random.default_rng(seed)
    
    cids = customers_df["customer_id"].values
    chosen_cids = rng.choice(cids, size=n_scenarios, replace=True)
    
    rows = []
    for i in range(n_scenarios):
        spec = rng.choice(VOICE_INTENTS)
        cid = chosen_cids[i]
        
        # In 10% of cases escalate payment stuck if high value
        should_esc = spec["should_escalate"]
        if spec["intent"] == "PAYMENT_STUCK" and rng.random() < 0.15:
            should_esc = 1
            
        rows.append({
            "scenario_id": f"VOICE-{i+1:03d}",
            "customer_id": cid,
            "intent": spec["intent"],
            "verification_required": spec["verification_required"],
            "expected_result": spec["expected_result"],
            "expected_tool": spec["expected_tool"],
            "should_escalate": should_esc
        })
        
    return pd.DataFrame(rows)
