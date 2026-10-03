"""
Upay AI Financial Intelligence Platform — Backend Service Gateway
Integrates Smart Report & Cases, Dual-Currency Smart Card, AI Credit Readiness, and AI Voice Customer Service.
"""

import sys
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from backend.app.database.connection import engine, Base
from backend.app.api.routes.auth import router as auth_router
from backend.app.api.routes.reports import router as reports_router
from backend.app.api.routes.cards import router as cards_router
from backend.app.api.routes.credit import router as credit_router
from backend.app.api.routes.voice import router as voice_router
from backend.app.api.routes.audit import router as audit_router
from backend.app.api.routes.health import router as health_router
from backend.seed_data import seed_database

# Initialize database schema and demo records
Base.metadata.create_all(bind=engine)
seed_database()

app = FastAPI(
    title="Upay AI Financial Intelligence Platform",
    description="Full Integrated Product API for Smart Report, Smart Card, Credit Readiness, and Voice AI.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Enable CORS for Next.js / React / Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routes under /api/v1
API_PREFIX = "/api/v1"
app.include_router(health_router, prefix=API_PREFIX)
app.include_router(auth_router, prefix=API_PREFIX)
app.include_router(reports_router, prefix=API_PREFIX)
app.include_router(cards_router, prefix=API_PREFIX)
app.include_router(credit_router, prefix=API_PREFIX)
app.include_router(voice_router, prefix=API_PREFIX)
app.include_router(audit_router, prefix=API_PREFIX)

@app.get("/")
def root():
    return {
        "service": "Upay AI Financial Intelligence Platform",
        "status": "ONLINE",
        "docs": "/docs",
        "environment": "Controlled Hackathon Proof of Concept"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
