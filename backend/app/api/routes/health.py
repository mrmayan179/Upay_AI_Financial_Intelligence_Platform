"""
System Health & AI Model Metadata Routes
"""

import json
from pathlib import Path
from fastapi import APIRouter

router = APIRouter(prefix="", tags=["Health & Diagnostics"])

AI_MODELS_DIR = Path(__file__).resolve().parent.parent.parent.parent / "ai_models"

@router.get("/health")
def health_status():
    return {
        "status": "HEALTHY",
        "service": "Upay AI Financial Intelligence Platform",
        "version": "1.0.0",
        "environment": "Controlled Hackathon Proof of Concept",
        "active_modules": [
            "Smart Report & Case Management",
            "Dual-Currency Smart Card + AI Security",
            "AI Credit Readiness & Loan Recommendation",
            "AI Voice Customer Service"
        ]
    }

@router.get("/models/metadata")
def get_models_metadata():
    reg_file = AI_MODELS_DIR / "model_registry.json"
    if reg_file.exists():
        with open(reg_file, "r") as f:
            return json.load(f)
    return {"message": "Model registry file not found"}
