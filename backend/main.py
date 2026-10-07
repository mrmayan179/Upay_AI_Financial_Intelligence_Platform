"""
Upay AI Financial Intelligence Platform — Backend Service Gateway
Integrates Smart Report & Cases, Dual-Currency Smart Card, AI Credit Readiness, and AI Voice Customer Service.
"""

import sys
from pathlib import Path
from fastapi import FastAPI
from fastapi.responses import HTMLResponse
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
from backend.app.api.routes.supabase_route import router as supabase_router
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

# Explicit CORS Configuration (No wildcard origin for production security compliance)
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    "http://localhost:5173",
    "http://127.0.0.1:5173"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Custom Security Headers Middleware
@app.middleware("http")
async def add_security_headers_middleware(request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "SAMEORIGIN"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response

# Mount Evidence Report & Assets
EVIDENCE_HTML_PATH = PROJECT_ROOT / "model_competition" / "evidence" / "final_report.html"
EVIDENCE_DIR = PROJECT_ROOT / "model_competition" / "evidence"
if EVIDENCE_DIR.exists():
    app.mount("/evidence-files", StaticFiles(directory=str(EVIDENCE_DIR)), name="evidence_files")

@app.get("/evidence", response_class=HTMLResponse, tags=["AI Model & Dataset Evidence"])
def get_evidence_report():
    """Serves the primary certified AI Model & Dataset Evidence Report (HTML)"""
    if EVIDENCE_HTML_PATH.exists():
        with open(EVIDENCE_HTML_PATH, "r", encoding="utf-8") as f:
            return HTMLResponse(content=f.read())
    return HTMLResponse(content="<h2>Evidence report not found</h2>", status_code=404)

# Mount Routes under /api/v1
API_PREFIX = "/api/v1"
app.include_router(health_router, prefix=API_PREFIX)
app.include_router(auth_router, prefix=API_PREFIX)
app.include_router(reports_router, prefix=API_PREFIX)
app.include_router(cards_router, prefix=API_PREFIX)
app.include_router(credit_router, prefix=API_PREFIX)
app.include_router(voice_router, prefix=API_PREFIX)
app.include_router(audit_router, prefix=API_PREFIX)
app.include_router(supabase_router, prefix=API_PREFIX)

@app.get("/api")
def api_info():
    return {
        "service": "Upay AI Financial Intelligence Platform",
        "status": "ONLINE",
        "docs": "/docs",
        "environment": "Controlled Hackathon Proof of Concept"
    }

FRONTEND_DIST = PROJECT_ROOT / "frontend" / "dist"
if FRONTEND_DIST.exists():
    app.mount("/", StaticFiles(directory=str(FRONTEND_DIST), html=True), name="frontend")
else:
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
