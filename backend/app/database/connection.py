"""
Database Connection & Session Factory
Supports SQLite for zero-config local prototyping and PostgreSQL for staging/production.
"""

import os
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_DIR = Path(__file__).resolve().parent.parent.parent.parent / "database"
DATABASE_DIR.mkdir(parents=True, exist_ok=True)

DEFAULT_SQLITE_URL = f"sqlite:///{DATABASE_DIR / 'upay_platform.db'}"
DATABASE_URL = os.getenv("DATABASE_URL", DEFAULT_SQLITE_URL)

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    """Dependency that yields database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
