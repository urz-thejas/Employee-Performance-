"""
Scikit-learn Classification Pipeline Module.

Model: RandomForestClassifier(n_estimators=100, random_state=42)
Split: 80/20 Stratified Train/Test Split
Input Features (9):
  - Attendance_Rate
  - Task_Completion_Rate
  - Productivity_Score
  - Quality_Score
  - Training_Hours
  - Experience_Years
  - Deadline_Completion_Rate
  - Customer_Feedback_Score
  - Projects_Completed
Target:
  - Performance_Category ('High', 'Medium', 'Needs Support')

Zero Target Leakage Guarantee:
  - Performance_Category and Overall_Performance_Score are strictly excluded from X.
  - Train/test split is performed before fitting the classifier.
"""

import os
from typing import Dict, Any, List
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
    classification_report,
)

from feature_engineering import compute_single_employee_features

FEATURE_COLUMNS: List[str] = [
    "Attendance_Rate",
    "Task_Completion_Rate",
    "Productivity_Score",
    "Quality_Score",
    "Training_Hours",
    "Experience_Years",
    "Deadline_Completion_Rate",
    "Customer_Feedback_Score",
    "Projects_Completed",
]

TARGET_COLUMN: str = "Performance_Category"
CLASS_ORDER: List[str] = ["High", "Medium", "Needs Support"]


class EmployeePerformanceModel:
    """Manages training, evaluation, persistence, and inference for the Random Forest model."""

    def __init__(self, model_path: str = None):
        if model_path is None:
            base_dir = os.path.dirname(os.path.abspath(__file__))
            data_dir = os.path.join(base_dir, "data")
            os.makedirs(data_dir, exist_ok=True)
            model_path = os.path.join(data_dir, "rf_performance_model.joblib")
        self.model_path = model_path
        self.model: RandomForestClassifier = None
        self.evaluation_metrics: Dict[str, Any] = None
        self.feature_importances: List[Dict[str, Any]] = None

    def train_and_evaluate(self, df_engineered: pd.DataFrame) -> Dict[str, Any]:
        """
        Split dataset 80/20 with stratification, train RandomForestClassifier(n_estimators=100, random_state=42),
        and calculate real evaluation metrics on the held-out 20% test split.
        """
        for col in FEATURE_COLUMNS + [TARGET_COLUMN]:
            if col not in df_engineered.columns:
                raise ValueError(f"Required column '{col}' missing from engineered dataset.")

        # Explicitly select only the 9 input features to prevent target leakage
        X = df_engineered[FEATURE_COLUMNS].copy()
        y = df_engineered[TARGET_COLUMN].astype(str).copy()

        X_train, X_test, y_train, y_test = train_test_split(
            X,
            y,
            test_size=0.20,
            random_state=42,
            stratify=y,
        )

        clf = RandomForestClassifier(
            n_estimators=100,
            random_state=42,
        )
        clf.fit(X_train, y_train)
        self.model = clf

        y_pred = clf.predict(X_test)
        y_train_pred = clf.predict(X_train)

        # Ordered class labels present in dataset
        present_labels = [c for c in CLASS_ORDER if c in set(y.unique())]
        if not present_labels:
            present_labels = sorted(list(y.unique()))

        acc = accuracy_score(y_test, y_pred)
        train_acc = accuracy_score(y_train, y_train_pred)
        prec_weighted = precision_score(y_test, y_pred, labels=present_labels, average="weighted", zero_division=0)
        rec_weighted = recall_score(y_test, y_pred, labels=present_labels, average="weighted", zero_division=0)
        f1_weighted = f1_score(y_test, y_pred, labels=present_labels, average="weighted", zero_division=0)

        prec_macro = precision_score(y_test, y_pred, labels=present_labels, average="macro", zero_division=0)
        rec_macro = recall_score(y_test, y_pred, labels=present_labels, average="macro", zero_division=0)
        f1_macro = f1_score(y_test, y_pred, labels=present_labels, average="macro", zero_division=0)

        cm = confusion_matrix(y_test, y_pred, labels=present_labels)
        report_dict = classification_report(
            y_test, y_pred, labels=present_labels, target_names=present_labels, output_dict=True, zero_division=0
        )
        report_text = classification_report(
            y_test, y_pred, labels=present_labels, target_names=present_labels, output_dict=False, zero_division=0
        )

        # Feature importances sorted descending
        raw_importances = clf.feature_importances_
        fi_list = []
        for feat_name, imp_val in zip(FEATURE_COLUMNS, raw_importances):
            fi_list.append(
                {
                    "feature": feat_name,
                    "label": feat_name.replace("_", " "),
                    "importance": round(float(imp_val), 4),
                    "importance_pct": round(float(imp_val) * 100.0, 2),
                }
            )
        fi_list.sort(key=lambda item: item["importance"], reverse=True)
        self.feature_importances = fi_list

        per_class_report = []
        for cls_name in present_labels:
            cls_metrics = report_dict.get(cls_name, {})
            per_class_report.append(
                {
                    "category": cls_name,
                    "precision": round(float(cls_metrics.get("precision", 0.0)), 4),
                    "recall": round(float(cls_metrics.get("recall", 0.0)), 4),
                    "f1_score": round(float(cls_metrics.get("f1-score", 0.0)), 4),
                    "support": int(cls_metrics.get("support", 0)),
                }
            )

        self.evaluation_metrics = {
            "model_name": "RandomForestClassifier",
            "hyperparameters": {
                "n_estimators": 100,
                "random_state": 42,
                "train_test_split": "80% Train / 20% Test (Stratified)",
                "criterion": "gini",
                "input_features_count": len(FEATURE_COLUMNS),
            },
            "train_samples": int(len(X_train)),
            "test_samples": int(len(X_test)),
            "accuracy": round(float(acc), 4),
            "accuracy_pct": round(float(acc) * 100.0, 2),
            "train_accuracy": round(float(train_acc), 4),
            "precision": round(float(prec_weighted), 4),
            "precision_pct": round(float(prec_weighted) * 100.0, 2),
            "recall": round(float(rec_weighted), 4),
            "recall_pct": round(float(rec_weighted) * 100.0, 2),
            "f1_score": round(float(f1_weighted), 4),
            "f1_score_pct": round(float(f1_weighted) * 100.0, 2),
            "macro_avg": {
                "precision": round(float(prec_macro), 4),
                "recall": round(float(rec_macro), 4),
                "f1_score": round(float(f1_macro), 4),
            },
            "weighted_avg": {
                "precision": round(float(prec_weighted), 4),
                "recall": round(float(rec_weighted), 4),
                "f1_score": round(float(f1_weighted), 4),
            },
            "class_labels": present_labels,
            "confusion_matrix": cm.tolist(),
            "classification_report": per_class_report,
            "classification_report_text": report_text,
            "feature_importances": self.feature_importances,
            "disclaimer": (
                "Metrics are computed on a held-out 20% stratified test split of synthetic academic "
                "demonstration data. They do not represent real-world workplace prediction accuracy."
            ),
        }

        # Persist trained model artifact
        joblib.dump(
            {
                "model": self.model,
                "evaluation_metrics": self.evaluation_metrics,
                "feature_importances": self.feature_importances,
                "feature_columns": FEATURE_COLUMNS,
            },
            self.model_path,
        )

        return self.evaluation_metrics

    def predict_employee(self, payload: dict) -> Dict[str, Any]:
        """Run inference on an individual employee input payload."""
        if self.model is None:
            if os.path.exists(self.model_path):
                saved = joblib.load(self.model_path)
                self.model = saved["model"]
                self.evaluation_metrics = saved["evaluation_metrics"]
                self.feature_importances = saved["feature_importances"]
            else:
                raise RuntimeError("Model has not been trained yet.")

        derived = compute_single_employee_features(payload)
        X_row = pd.DataFrame([{col: derived[col] for col in FEATURE_COLUMNS}])

        pred_class = str(self.model.predict(X_row)[0])
        probs_arr = self.model.predict_proba(X_row)[0]
        model_classes = [str(c) for c in self.model.classes_]

        prob_map = {cls_name: 0.0 for cls_name in CLASS_ORDER}
        for cls_name, p_val in zip(model_classes, probs_arr):
            prob_map[cls_name] = round(float(p_val) * 100.0, 2)

        confidence = prob_map.get(pred_class, round(float(np.max(probs_arr)) * 100.0, 2))

        recommendations = {
            "High": (
                "Candidate for leadership mentoring, high-impact project ownership, "
                "and recognition initiatives."
            ),
            "Medium": (
                "Solid core contributor. Targeted skill-building workshops and deadline "
                "coaching can help transition to High performance."
            ),
            "Needs Support": (
                "Recommend structured 1-on-1 coaching, workload calibration, attendance "
                "support, and focused training modules."
            ),
        }

        return {
            "predicted_category": pred_class,
            "confidence_pct": confidence,
            "probabilities": prob_map,
            "engineered_features": derived,
            "feature_importances": self.feature_importances,
            "recommendation": recommendations.get(pred_class, ""),
            "disclaimer": (
                "Illustrative decision-support output generated by a Random Forest model trained on "
                "synthetic academic data. Not intended for automated HR employment decisions."
            ),
        }
