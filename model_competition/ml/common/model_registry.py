"""
Model Registry & Metadata Management
Tracks model artifacts, algorithm hyperparameters, and evaluation benchmarks.
"""

import json
from pathlib import Path
from typing import Dict, Any
from datetime import datetime
from data_factory.config import MODELS_DIR

REGISTRY_PATH = MODELS_DIR / "model_registry.json"

def load_registry() -> Dict[str, Any]:
    """Load existing model registry or return empty structure."""
    if REGISTRY_PATH.exists():
        with open(REGISTRY_PATH, "r") as f:
            return json.load(f)
    return {
        "registry_version": "1.0.0",
        "last_updated": datetime.now().isoformat(),
        "models": {}
    }

def register_model(
    model_name: str,
    model_version: str,
    algorithm: str,
    features: list,
    hyperparameters: Dict[str, Any],
    metrics: Dict[str, Any],
    artifact_filename: str,
    dataset_version: str = "v1.0.0"
) -> Dict[str, Any]:
    """Register or update a trained model in the registry."""
    registry = load_registry()
    
    entry = {
        "model_name": model_name,
        "model_version": model_version,
        "training_dataset_version": dataset_version,
        "training_date": datetime.now().isoformat(),
        "algorithm": algorithm,
        "features": features,
        "hyperparameters": hyperparameters,
        "metrics": metrics,
        "artifact_path": str(MODELS_DIR / artifact_filename)
    }
    
    registry["models"][model_name] = entry
    registry["last_updated"] = datetime.now().isoformat()
    
    with open(REGISTRY_PATH, "w") as f:
        json.dump(registry, f, indent=2)
        
    return entry
