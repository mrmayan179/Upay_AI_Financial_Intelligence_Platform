"""
Evaluation Metrics & Visualization Utilities
"""

from pathlib import Path
from typing import Dict, Any
import numpy as np
import matplotlib
matplotlib.use("Agg")  # Non-interactive backend for headless execution
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    average_precision_score,
    confusion_matrix,
    roc_curve,
    precision_recall_curve
)

def compute_classification_metrics(y_true, y_pred, y_prob=None) -> Dict[str, Any]:
    """Compute standard evaluation metrics."""
    metrics = {
        "accuracy": float(accuracy_score(y_true, y_pred)),
        "precision": float(precision_score(y_true, y_pred, zero_division=0)),
        "recall": float(recall_score(y_true, y_pred, zero_division=0)),
        "f1": float(f1_score(y_true, y_pred, zero_division=0)),
    }
    
    if y_prob is not None:
        try:
            metrics["roc_auc"] = float(roc_auc_score(y_true, y_prob))
            metrics["pr_auc"] = float(average_precision_score(y_true, y_prob))
        except Exception:
            metrics["roc_auc"] = 0.0
            metrics["pr_auc"] = 0.0
            
    cm = confusion_matrix(y_true, y_pred)
    tn, fp, fn, tp = cm.ravel() if cm.shape == (2, 2) else (0, 0, 0, 0)
    metrics["confusion_matrix"] = {
        "tn": int(tn),
        "fp": int(fp),
        "fn": int(fn),
        "tp": int(tp)
    }
    
    return metrics

def plot_confusion_matrix(cm_dict: Dict[str, int], title: str, save_path: Path):
    """Plot and save a styled confusion matrix heatmap."""
    cm = np.array([
        [cm_dict["tn"], cm_dict["fp"]],
        [cm_dict["fn"], cm_dict["tp"]]
    ])
    
    plt.figure(figsize=(5.5, 4.5), dpi=150)
    sns.heatmap(
        cm,
        annot=True,
        fmt="d",
        cmap="Blues",
        cbar=False,
        xticklabels=["Negative (0)", "Positive (1)"],
        yticklabels=["Negative (0)", "Positive (1)"]
    )
    plt.title(title, fontsize=12, fontweight="bold", pad=12)
    plt.xlabel("Predicted Label", fontsize=10)
    plt.ylabel("True Label", fontsize=10)
    plt.tight_layout()
    plt.savefig(save_path, bbox_inches="tight")
    plt.close()

def plot_roc_curve(y_true, y_prob, title: str, save_path: Path):
    """Plot and save an ROC curve."""
    fpr, tpr, _ = roc_curve(y_true, y_prob)
    auc_val = roc_auc_score(y_true, y_prob)
    
    plt.figure(figsize=(5.5, 4.5), dpi=150)
    plt.plot(fpr, tpr, color="#1f77b4", lw=2, label=f"ROC curve (AUC = {auc_val:.3f})")
    plt.plot([0, 1], [0, 1], color="#7f7f7f", lw=1.5, linestyle="--", label="Random Classifier")
    plt.xlim([0.0, 1.0])
    plt.ylim([0.0, 1.05])
    plt.xlabel("False Positive Rate", fontsize=10)
    plt.ylabel("True Positive Rate (Recall)", fontsize=10)
    plt.title(title, fontsize=12, fontweight="bold", pad=12)
    plt.legend(loc="lower right")
    plt.grid(True, linestyle=":", alpha=0.6)
    plt.tight_layout()
    plt.savefig(save_path, bbox_inches="tight")
    plt.close()
