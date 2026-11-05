"""
Automated Pytest Suite for Employee Performance Analytics System Backend.
"""

import io
import os
import sys
import tempfile
from fastapi.testclient import TestClient

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from dataset_generator import generate_employee_dataset
from preprocessing import preprocess_employee_data
from feature_engineering import engineer_features
from model import FEATURE_COLUMNS, TARGET_COLUMN
from main import app, state

# Ensure fresh 1,000-employee dataset before running tests
state.initialize(force_regenerate=True)
client = TestClient(app)


def test_dataset_generation_and_preprocessing():
    with tempfile.NamedTemporaryFile(suffix=".csv", delete=False) as tmp:
        tmp_path = tmp.name
    try:
        df_raw = generate_employee_dataset(
            output_csv_path=tmp_path, n_unique=1000, n_duplicates=18, random_seed=42
        )
        assert len(df_raw) == 1018
        assert df_raw.isna().sum().sum() >= 32

        df_clean, summary = preprocess_employee_data(df_raw)
        assert summary["original_record_count"] == 1018
        assert summary["cleaned_record_count"] == 1000
        assert summary["duplicate_records_removed"] == 18
        assert summary["missing_values_handled"] == 32
        assert summary["remaining_missing_values"] == 0
        assert len(df_clean) == 1000
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)


def test_feature_engineering_and_zero_division_safety():
    with tempfile.NamedTemporaryFile(suffix=".csv", delete=False) as tmp:
        tmp_path = tmp.name
    try:
        df_raw = generate_employee_dataset(
            output_csv_path=tmp_path, n_unique=50, n_duplicates=2, random_seed=99
        )
        df_clean, _ = preprocess_employee_data(df_raw)
        df_eng = engineer_features(df_clean)

        expected_engineered = [
            "Attendance_Rate",
            "Task_Completion_Rate",
            "Productivity_Score",
            "Experience_Level",
            "Training_Efficiency",
            "Overall_Performance_Score",
        ]
        for col in expected_engineered:
            assert col in df_eng.columns
            assert df_eng[col].isna().sum() == 0

        row0 = df_eng.iloc[0]
        expected_prod = round(row0["Task_Completion_Rate"] * 0.60 + row0["Quality_Score"] * 0.40, 2)
        assert abs(row0["Productivity_Score"] - expected_prod) < 0.05
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)


def test_random_forest_model_and_no_leakage():
    assert TARGET_COLUMN not in FEATURE_COLUMNS
    assert "Overall_Performance_Score" not in FEATURE_COLUMNS
    assert len(FEATURE_COLUMNS) == 9

    res = client.get("/api/model/evaluation")
    assert res.status_code == 200
    data = res.json()
    assert data["model_name"] == "RandomForestClassifier"
    assert data["hyperparameters"]["n_estimators"] == 100
    assert data["hyperparameters"]["random_state"] == 42
    assert data["train_samples"] == 800
    assert data["test_samples"] == 200
    assert 0.70 <= data["accuracy"] <= 1.0
    assert len(data["confusion_matrix"]) == 3
    assert len(data["classification_report"]) == 3


def test_all_api_endpoints():
    r_health = client.get("/api/health")
    assert r_health.status_code == 200
    assert r_health.json()["status"] == "healthy"
    assert r_health.json()["total_clean_records"] == 1000

    r_dash = client.get("/api/dashboard?department=IT&category=All")
    assert r_dash.status_code == 200
    dash = r_dash.json()
    assert dash["kpis"]["total_employees"] > 0
    assert len(dash["charts"]["performance_distribution"]) == 3
    assert len(dash["charts"]["department_performance"]) >= 1

    r_emp = client.get("/api/employees?page=1&page_size=10&department=Sales")
    assert r_emp.status_code == 200
    emp_data = r_emp.json()
    assert len(emp_data["records"]) == 10
    assert all(r["Department"] == "Sales" for r in emp_data["records"])

    r_ana = client.get("/api/analytics")
    assert r_ana.status_code == 200
    ana = r_ana.json()
    assert ana["cleaning_summary"]["cleaned_record_count"] == 1000
    assert len(ana["feature_engineering_table"]) == 25

    r_fi = client.get("/api/model/feature-importance")
    assert r_fi.status_code == 200
    assert len(r_fi.json()["feature_importances"]) == 9

    # Test CSV downloads
    r_raw_dl = client.get("/api/download/raw")
    assert r_raw_dl.status_code == 200
    assert "Employee_ID" in r_raw_dl.text

    r_proc_dl = client.get("/api/download/processed")
    assert r_proc_dl.status_code == 200
    assert "Productivity_Score" in r_proc_dl.text


def test_individual_prediction_and_csv_upload_validation():
    high_payload = {
        "attendance_rate": 96.5,
        "task_completion_rate": 94.0,
        "quality_score": 92.0,
        "training_hours": 48.0,
        "experience_years": 7.5,
        "projects_completed": 11,
        "deadline_completion_rate": 95.0,
        "customer_feedback_score": 4.8,
    }
    r_pred = client.post("/api/predict", json=high_payload)
    assert r_pred.status_code == 200
    pred_data = r_pred.json()
    assert pred_data["predicted_category"] == "High"
    assert abs(sum(pred_data["probabilities"].values()) - 100.0) < 0.5

    low_payload = {
        "attendance_rate": 68.0,
        "task_completion_rate": 52.0,
        "quality_score": 54.0,
        "training_hours": 10.0,
        "experience_years": 1.0,
        "projects_completed": 1,
        "deadline_completion_rate": 55.0,
        "customer_feedback_score": 2.1,
    }
    r_pred_low = client.post("/api/predict", json=low_payload)
    assert r_pred_low.status_code == 200
    assert r_pred_low.json()["predicted_category"] == "Needs Support"

    # CSV upload validation error for missing columns
    bad_csv = b"Employee_ID,Employee_Name\nEMP-1,Test User\n" * 15
    r_bad = client.post(
        "/api/upload",
        files={"file": ("invalid.csv", io.BytesIO(bad_csv), "text/csv")},
    )
    assert r_bad.status_code == 422
