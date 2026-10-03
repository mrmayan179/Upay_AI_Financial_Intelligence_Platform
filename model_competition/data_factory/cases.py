"""
Case & Case Event Entity Generator
Generates dispute resolution workflows, assigned agents, and event timelines.
"""

import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from data_factory.config import RANDOM_SEED

def generate_cases_and_events(complaints_df: pd.DataFrame, seed: int = RANDOM_SEED):
    """Generate cases and granular event timelines corresponding to complaints."""
    rng = np.random.default_rng(seed)
    
    n_cases = len(complaints_df)
    case_rows = []
    event_rows = []
    event_counter = 1
    
    for i, comp in complaints_df.iterrows():
        case_id = f"SYN-CASE-{10001 + i}"
        comp_id = comp["complaint_id"]
        cust_id = comp["customer_id"]
        cat = comp["category"]
        prio = comp["priority"]
        team = comp["assigned_team"]
        escalated = comp["escalated"]
        c_time = datetime.fromisoformat(comp["created_at"])
        res_minutes = comp["resolution_time_minutes"]
        
        agent_id = f"AGT-{rng.integers(401, 420)}"
        
        # Lifecycle status
        if comp["resolution_type"] == "IN_PROGRESS":
            status = rng.choice(["INVESTIGATING", "UNDER_REVIEW", "WAITING_FOR_CUSTOMER"])
            progress = int(rng.choice([35, 50, 70]))
            resolved_at = ""
            updated_at = c_time + timedelta(minutes=int(rng.integers(30, 240)))
        else:
            status = rng.choice(["RESOLVED", "CLOSED"], p=[0.75, 0.25])
            progress = 100
            resolved_time = c_time + timedelta(minutes=int(res_minutes))
            resolved_at = resolved_time.isoformat()
            updated_at = resolved_time
            
        esc_level = 1 if escalated else 0
        if prio == "CRITICAL" and escalated:
            esc_level = 2
            
        case_rows.append({
            "case_id": case_id,
            "complaint_id": comp_id,
            "customer_id": cust_id,
            "case_category": cat,
            "priority": prio,
            "status": status,
            "progress_percent": progress,
            "assigned_team": team,
            "assigned_agent": agent_id,
            "created_at": c_time.isoformat(),
            "updated_at": updated_at.isoformat(),
            "resolved_at": resolved_at,
            "escalation_level": esc_level
        })
        
        # Timeline events
        # Event 1: Creation
        event_rows.append({
            "case_event_id": f"SYN-EVT-{event_counter}",
            "case_id": case_id,
            "timestamp": c_time.isoformat(),
            "event_type": "CASE_CREATED",
            "description": f"Customer initiated dispute regarding {cat.lower()}.",
            "actor_type": "SYSTEM",
            "actor_id": "SYS-AUTO"
        })
        event_counter += 1
        
        # Event 2: Assignment
        assign_time = c_time + timedelta(minutes=int(rng.integers(2, 15)))
        event_rows.append({
            "case_event_id": f"SYN-EVT-{event_counter}",
            "case_id": case_id,
            "timestamp": assign_time.isoformat(),
            "event_type": "ASSIGNED",
            "description": f"Case assigned to {team} operator {agent_id}.",
            "actor_type": "AI_COPILOT",
            "actor_id": "AI-DISPATCHER"
        })
        event_counter += 1
        
        # Event 3: Investigation
        inv_time = assign_time + timedelta(minutes=int(rng.integers(10, 45)))
        event_rows.append({
            "case_event_id": f"SYN-EVT-{event_counter}",
            "case_id": case_id,
            "timestamp": inv_time.isoformat(),
            "event_type": "INVESTIGATION_STARTED",
            "description": "Ledger entries and transaction logs retrieved for analysis.",
            "actor_type": "AGENT",
            "actor_id": agent_id
        })
        event_counter += 1
        
        # Optional Escalation Event
        if esc_level > 0:
            esc_time = inv_time + timedelta(minutes=int(rng.integers(15, 60)))
            event_rows.append({
                "case_event_id": f"SYN-EVT-{event_counter}",
                "case_id": case_id,
                "timestamp": esc_time.isoformat(),
                "event_type": "ESCALATED",
                "description": f"Case escalated to Level {esc_level} supervisor due to {prio} severity.",
                "actor_type": "AI_COPILOT",
                "actor_id": "AI-RISK-MONITOR"
            })
            event_counter += 1
            
        # Event: Resolution if completed
        if progress == 100:
            event_rows.append({
                "case_event_id": f"SYN-EVT-{event_counter}",
                "case_id": case_id,
                "timestamp": resolved_at,
                "event_type": "RESOLVED",
                "description": f"Dispute closed with action {comp['resolution_type']}.",
                "actor_type": "AGENT",
                "actor_id": agent_id
            })
            event_counter += 1
            
    cases_df = pd.DataFrame(case_rows)
    events_df = pd.DataFrame(event_rows)
    return cases_df, events_df
