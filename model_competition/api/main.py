"""
Upay AI Financial Intelligence Platform — FastAPI Application
Part 1: Data & AI/ML Foundation Serving Layer
"""

import sys
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from data_factory.config import DATASET_VERSION
from ml.common.model_registry import load_registry
from api.routes.fraud import router as fraud_router
from api.routes.anomaly import router as anomaly_router
from api.routes.credit import router as credit_router
from api.routes.risk_engine import router as risk_router
from api.routes.explain import router as explain_router

app = FastAPI(
    title="Upay AI Financial Intelligence Platform",
    description=(
        "Production AI/ML Foundation API for Upay MFS.\n\n"
        "Provides explainable fraud risk scoring, behavioral anomaly detection, "
        "credit readiness assessment, and unified business-rule risk gating."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Enable CORS for downstream Card, Report, Loan, and Voice frontends
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routes under /api/v1
API_PREFIX = "/api/v1"
app.include_router(fraud_router, prefix=API_PREFIX)
app.include_router(anomaly_router, prefix=API_PREFIX)
app.include_router(credit_router, prefix=API_PREFIX)
app.include_router(risk_router, prefix=API_PREFIX)
app.include_router(explain_router, prefix=API_PREFIX)

@app.get("/health", tags=["Health & Metadata"])
@app.get("/api/v1/health", tags=["Health & Metadata"])
def health_check():
    """Health status and platform version check."""
    return {
        "status": "HEALTHY",
        "service": "Upay AI Platform — Foundation ML Layer",
        "dataset_version": DATASET_VERSION,
        "models_loaded": {
            "fraud_xgboost": True,
            "anomaly_isolation_forest": True,
            "credit_xgboost": True
        }
    }

@app.get("/api/v1/models/metadata", tags=["Health & Metadata"])
def get_model_metadata():
    """Retrieve active model registry metadata and performance benchmarks."""
    registry = load_registry()
    return registry

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api.main:app", host="0.0.0.0", port=8000, reload=True)
