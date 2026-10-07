"""
Database Schema Migration Utility
Ensures all columns exist in SQLite tables.
"""
from backend.app.database.connection import engine
from sqlalchemy import text

def run_migration():
    with engine.connect() as conn:
        cols = [r[1] for r in conn.execute(text("PRAGMA table_info(card_transactions)")).fetchall()]
        print("Existing card_transactions columns:", cols)
        
        new_cols = [
            ("risk_breakdown", "TEXT DEFAULT '{}'"),
            ("fraud_score", "INTEGER DEFAULT 0"),
            ("anomaly_score", "INTEGER DEFAULT 0"),
            ("device_id", "VARCHAR(50) DEFAULT 'DEV-APP-01'"),
            ("recommended_action", "VARCHAR(100) DEFAULT 'ALLOW'"),
            ("model_version", "VARCHAR(80) DEFAULT 'fraud-xgb-1.0.0+anomaly-iforest-1.0.0'")
        ]
        
        for col_name, col_type in new_cols:
            if col_name not in cols:
                conn.execute(text(f"ALTER TABLE card_transactions ADD COLUMN {col_name} {col_type}"))
                print(f"[MIGRATION] Added column '{col_name}' to card_transactions")
                
        conn.commit()
    print("[MIGRATION] Schema verification complete.")

if __name__ == "__main__":
    run_migration()
