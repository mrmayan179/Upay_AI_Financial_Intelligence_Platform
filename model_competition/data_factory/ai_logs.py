"""
AI Activity Log Entity Generator
Generates operational audit trails, latency metrics, and governance logging for AI models.
"""

import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from data_factory.config import RANDOM_SEED

def generate_ai_logs(customers_df: pd.DataFrame, n_logs: int = 1000, seed: int = RANDOM_SEED) -> pd.DataFrame:
    """Generate n AI activity logs representing inference and tool calls."""
    rng = np.random.default_rng(seed)
    
    cids = customers_df["customer_id"].values
    chosen_cids = rng.choice(cids, size=n_logs, replace=True)
    
    components = ["FRAUD_ENGINE", "ANOMALY_ENGINE", "CREDIT_ENGINE", "VOICE_AI", "REPORT_COPILOT"]
    comp_weights = [0.35, 0.25, 0.20, 0.12, 0.08]
    
    start_time = datetime(2026, 9, 1, 0, 0, 0)
    total_seconds = int((datetime(2026, 9, 30, 23, 59, 59) - start_time).total_seconds())
    offsets = np.sort(rng.integers(0, total_seconds, size=n_logs))
    
    rows = []
    for i in range(n_logs):
        cid = chosen_cids[i]
        comp = rng.choice(components, p=comp_weights)
        l_time = start_time + timedelta(seconds=int(offsets[i]))
        session_id = f"SESS-{rng.integers(10000, 99999)}"
        
        if comp == "FRAUD_ENGINE":
            action = "TRANSACTION_RISK_SCORING"
            tool = "xgb_fraud_predict"
            model_ver = "fraud-xgb-1.0.0"
            latency = round(float(rng.normal(18.0, 4.0)), 2)
            result = rng.choice(["SUCCESS", "FLAGGED", "BLOCKED"], p=[0.90, 0.07, 0.03])
            out_ref = f"risk_score={rng.integers(5, 95)}"
        elif comp == "ANOMALY_ENGINE":
            action = "BEHAVIORAL_OUTLIER_SCAN"
            tool = "iforest_score"
            model_ver = "anomaly-iforest-1.0.0"
            latency = round(float(rng.normal(12.0, 3.0)), 2)
            result = rng.choice(["SUCCESS", "FLAGGED"], p=[0.92, 0.08])
            out_ref = f"anomaly_flag={1 if result == 'FLAGGED' else 0}"
        elif comp == "CREDIT_ENGINE":
            action = "CREDIT_READINESS_ASSESSMENT"
            tool = "xgb_credit_evaluate"
            model_ver = "credit-xgb-1.0.0"
            latency = round(float(rng.normal(25.0, 6.0)), 2)
            result = "SUCCESS"
            out_ref = f"credit_score={rng.integers(40, 98)}"
        elif comp == "VOICE_AI":
            action = "VOICE_INTENT_DISPATCH"
            tool = rng.choice(["get_balance", "get_transaction", "create_case"])
            model_ver = "voice-agent-v1"
            latency = round(float(rng.normal(180.0, 40.0)), 2)
            result = "SUCCESS"
            out_ref = f"tool_dispatched={tool}"
        else: # REPORT_COPILOT
            action = "DISPUTE_SUMMARIZATION"
            tool = "case_copilot_summarize"
            model_ver = "case-copilot-v1"
            latency = round(float(rng.normal(220.0, 50.0)), 2)
            result = "SUCCESS"
            out_ref = "draft_summary_generated"
            
        latency = max(2.0, latency)
        
        rows.append({
            "ai_log_id": f"AI-LOG-{100001 + i}",
            "timestamp": l_time.isoformat(),
            "session_id": session_id,
            "customer_id": cid,
            "component": comp,
            "action": action,
            "tool_name": tool,
            "input_reference": f"REF-{cid}-HASH-{i:04X}",
            "output_reference": out_ref,
            "result": result,
            "latency_ms": latency,
            "model_version": model_ver
        })
        
    return pd.DataFrame(rows)
