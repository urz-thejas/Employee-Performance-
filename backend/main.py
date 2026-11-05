"""
FastAPI Backend for Employee Performance Analytics System.

Endpoints:
- GET  /api/health
- GET  /api/dashboard
- GET  /api/employees
- GET  /api/analytics
- GET  /api/model/evaluation
- GET  /api/model/feature-importance
- POST /api/predict
- POST /api/upload
- GET  /api/download/raw
- GET  /api/download/processed
"""

import io
import os
import joblib
from typing import Optional
import pandas as pd
from fastapi import FastAPI, File, HTTPException, Query, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel, Field, validator

from dataset_generator import generate_employee_dataset
from preprocessing import preprocess_employee_data, validate_columns, REQUIRED_COLUMNS
from feature_engineering import engineer_features
from model import EmployeePerformanceModel, FEATURE_COLUMNS

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
os.makedirs(DATA_DIR, exist_ok=True)

RAW_CSV_PATH = os.path.join(DATA_DIR, "raw_employee_data.csv")
PROCESSED_CSV_PATH = os.path.join(DATA_DIR, "processed_employee_data.csv")
MODEL_PATH = os.path.join(DATA_DIR, "rf_performance_model.joblib")

app = FastAPI(
    title="Employee Performance Analytics API",
    description=(
        "Full-stack HR Analytics API powered by Pandas Data Manipulation, "
        "Feature Engineering, and Scikit-learn RandomForestClassifier."
    ),
    version="1.0.0",
)

allowed_origins_env = os.getenv("CORS_ORIGINS", "*")
allowed_origins = (
    ["*"]
    if allowed_origins_env.strip() == "*"
    else [o.strip() for o in allowed_origins_env.split(",") if o.strip()]
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class PredictionRequest(BaseModel):
    attendance_rate: float = Field(..., ge=0.0, le=100.0, description="Attendance percentage (0-100)")
    task_completion_rate: float = Field(..., ge=0.0, le=100.0, description="Task completion percentage (0-100)")
    quality_score: float = Field(..., ge=0.0, le=100.0, description="Quality score (0-100)")
    training_hours: float = Field(..., ge=0.0, le=300.0, description="Training hours completed (0-300)")
    experience_years: float = Field(..., ge=0.0, le=45.0, description="Years of professional experience (0-45)")
    projects_completed: int = Field(..., ge=0, le=100, description="Number of completed projects (0-100)")
    deadline_completion_rate: float = Field(..., ge=0.0, le=100.0, description="Deadline completion rate (0-100)")
    customer_feedback_score: float = Field(..., ge=1.0, le=100.0, description="Customer feedback score (1.0-5.0 or 0-100)")

    @validator("customer_feedback_score")
    def normalize_feedback(cls, v):
        if v < 1.0:
            raise ValueError("Customer feedback score must be at least 1.0")
        return float(v)


class AppState:
    def __init__(self):
        self.df_raw: Optional[pd.DataFrame] = None
        self.df_clean: Optional[pd.DataFrame] = None
        self.df_engineered: Optional[pd.DataFrame] = None
        self.cleaning_summary: dict = {}
        self.ml_model = EmployeePerformanceModel(model_path=MODEL_PATH)
        self.evaluation_metrics: dict = {}

    def initialize(self, force_regenerate: bool = False):
        if force_regenerate or not os.path.exists(RAW_CSV_PATH):
            self.df_raw = generate_employee_dataset(output_csv_path=RAW_CSV_PATH)
        else:
            self.df_raw = pd.read_csv(RAW_CSV_PATH)
            if len(self.df_raw) < 1000:
                self.df_raw = generate_employee_dataset(output_csv_path=RAW_CSV_PATH)

        self.df_clean, self.cleaning_summary = preprocess_employee_data(self.df_raw)
        self.df_engineered = engineer_features(self.df_clean)
        self.df_engineered.to_csv(PROCESSED_CSV_PATH, index=False)

        if not force_regenerate and os.path.exists(MODEL_PATH):
            try:
                saved = joblib.load(MODEL_PATH)
                self.ml_model.model = saved["model"]
                self.ml_model.evaluation_metrics = saved["evaluation_metrics"]
                self.ml_model.feature_importances = saved["feature_importances"]
                self.evaluation_metrics = saved["evaluation_metrics"]
                return
            except Exception:
                pass

        self.evaluation_metrics = self.ml_model.train_and_evaluate(self.df_engineered)

    def load_custom_dataframe(self, df_uploaded: pd.DataFrame):
        self.df_raw = df_uploaded.copy()
        self.df_clean, self.cleaning_summary = preprocess_employee_data(self.df_raw)
        self.df_engineered = engineer_features(self.df_clean)
        self.df_engineered.to_csv(PROCESSED_CSV_PATH, index=False)
        self.evaluation_metrics = self.ml_model.train_and_evaluate(self.df_engineered)


state = AppState()
state.initialize()


def _filter_dataframe(
    df: pd.DataFrame,
    department: Optional[str] = None,
    category: Optional[str] = None,
    search: Optional[str] = None,
) -> pd.DataFrame:
    filtered = df
    if department and department.lower() not in ("all", ""):
        filtered = filtered[filtered["Department"].str.lower() == department.strip().lower()]
    if category and category.lower() not in ("all", ""):
        filtered = filtered[filtered["Performance_Category"].str.lower() == category.strip().lower()]
    if search and search.strip():
        q = search.strip().lower()
        mask = (
            filtered["Employee_ID"].str.lower().str.contains(q, na=False)
            | filtered["Employee_Name"].str.lower().str.contains(q, na=False)
            | filtered["Department"].str.lower().str.contains(q, na=False)
        )
        filtered = filtered[mask]
    return filtered


@app.get("/api/health", status_code=status.HTTP_200_OK)
def health_check():
    """Verify backend status, dataset availability, and ML model readiness."""
    return {
        "status": "healthy",
        "service": "Employee Performance Analytics Backend",
        "dataset_loaded": state.df_engineered is not None,
        "total_clean_records": int(len(state.df_engineered)) if state.df_engineered is not None else 0,
        "model_trained": state.ml_model.model is not None,
        "model_accuracy_pct": state.evaluation_metrics.get("accuracy_pct", 0.0),
    }


@app.get("/api/dashboard", status_code=status.HTTP_200_OK)
def get_dashboard(
    department: Optional[str] = Query(default="All", description="Filter by department"),
    category: Optional[str] = Query(default="All", description="Filter by performance category"),
    search: Optional[str] = Query(default="", description="Search by Employee ID or Name"),
):
    """Return KPIs, chart series, and recent employee records from actual backend data."""
    if state.df_engineered is None:
        state.initialize()

    df_all = state.df_engineered
    df = _filter_dataframe(df_all, department=department, category=category, search=search)

    total_employees = int(len(df))
    if total_employees == 0:
        return {
            "kpis": {
                "total_employees": 0,
                "avg_attendance": 0.0,
                "avg_productivity": 0.0,
                "avg_quality_score": 0.0,
                "high_performers": 0,
                "medium_performers": 0,
                "needs_support": 0,
                "avg_overall_score": 0.0,
            },
            "charts": {
                "performance_distribution": [],
                "department_performance": [],
                "attendance_vs_productivity": [],
                "employee_productivity_comparison": [],
            },
            "recent_employees": [],
            "departments": sorted(df_all["Department"].unique().tolist()),
        }

    cat_counts = df["Performance_Category"].value_counts().to_dict()
    high_cnt = int(cat_counts.get("High", 0))
    med_cnt = int(cat_counts.get("Medium", 0))
    low_cnt = int(cat_counts.get("Needs Support", 0))

    kpis = {
        "total_employees": total_employees,
        "avg_attendance": round(float(df["Attendance_Rate"].mean()), 2),
        "avg_productivity": round(float(df["Productivity_Score"].mean()), 2),
        "avg_quality_score": round(float(df["Quality_Score"].mean()), 2),
        "high_performers": high_cnt,
        "medium_performers": med_cnt,
        "needs_support": low_cnt,
        "avg_overall_score": round(float(df["Overall_Performance_Score"].mean()), 2),
    }

    perf_dist = [
        {
            "category": "High",
            "count": high_cnt,
            "percentage": round((high_cnt / total_employees) * 100.0, 1),
        },
        {
            "category": "Medium",
            "count": med_cnt,
            "percentage": round((med_cnt / total_employees) * 100.0, 1),
        },
        {
            "category": "Needs Support",
            "count": low_cnt,
            "percentage": round((low_cnt / total_employees) * 100.0, 1),
        },
    ]

    dept_perf = []
    for dept_name, grp in df.groupby("Department"):
        d_counts = grp["Performance_Category"].value_counts().to_dict()
        dept_perf.append(
            {
                "department": str(dept_name),
                "headcount": int(len(grp)),
                "avg_productivity": round(float(grp["Productivity_Score"].mean()), 2),
                "avg_attendance": round(float(grp["Attendance_Rate"].mean()), 2),
                "avg_quality": round(float(grp["Quality_Score"].mean()), 2),
                "avg_overall": round(float(grp["Overall_Performance_Score"].mean()), 2),
                "High": int(d_counts.get("High", 0)),
                "Medium": int(d_counts.get("Medium", 0)),
                "Needs_Support": int(d_counts.get("Needs Support", 0)),
            }
        )
    dept_perf.sort(key=lambda x: x["avg_productivity"], reverse=True)

    sample_size = min(150, len(df))
    df_scatter = df.iloc[:sample_size]
    att_vs_prod = [
        {
            "Employee_ID": str(r["Employee_ID"]),
            "Employee_Name": str(r["Employee_Name"]),
            "Department": str(r["Department"]),
            "Attendance_Rate": float(r["Attendance_Rate"]),
            "Productivity_Score": float(r["Productivity_Score"]),
            "Quality_Score": float(r["Quality_Score"]),
            "Performance_Category": str(r["Performance_Category"]),
        }
        for _, r in df_scatter.iterrows()
    ]

    df_top = df.sort_values(by="Productivity_Score", ascending=False).head(12)
    prod_comparison = [
        {
            "Employee_ID": str(r["Employee_ID"]),
            "Employee_Name": str(r["Employee_Name"]),
            "Department": str(r["Department"]),
            "Productivity_Score": float(r["Productivity_Score"]),
            "Task_Completion_Rate": float(r["Task_Completion_Rate"]),
            "Quality_Score": float(r["Quality_Score"]),
            "Performance_Category": str(r["Performance_Category"]),
        }
        for _, r in df_top.iterrows()
    ]

    recent_records = df.head(12).to_dict(orient="records")

    return {
        "kpis": kpis,
        "charts": {
            "performance_distribution": perf_dist,
            "department_performance": dept_perf,
            "attendance_vs_productivity": att_vs_prod,
            "employee_productivity_comparison": prod_comparison,
        },
        "recent_employees": recent_records,
        "departments": sorted(df_all["Department"].unique().tolist()),
    }


@app.get("/api/employees", status_code=status.HTTP_200_OK)
def get_employees(
    page: int = Query(default=1, ge=1, description="Page number (1-indexed)"),
    page_size: int = Query(default=15, ge=5, le=100, description="Records per page"),
    department: Optional[str] = Query(default="All", description="Filter by department"),
    category: Optional[str] = Query(default="All", description="Filter by performance category"),
    search: Optional[str] = Query(default="", description="Search by Employee ID or Name"),
    sort_by: Optional[str] = Query(default="Employee_ID", description="Column to sort by"),
    sort_dir: Optional[str] = Query(default="asc", description="Sort direction: asc or desc"),
):
    """Return searchable, filterable, and paginated employee records."""
    if state.df_engineered is None:
        state.initialize()

    df = _filter_dataframe(state.df_engineered, department=department, category=category, search=search)

    valid_sort_cols = set(df.columns)
    if sort_by in valid_sort_cols:
        ascending = sort_dir.lower() != "desc"
        df = df.sort_values(by=sort_by, ascending=ascending)

    total_records = int(len(df))
    total_pages = max(1, (total_records + page_size - 1) // page_size)
    current_page = min(page, total_pages)
    start_idx = (current_page - 1) * page_size
    end_idx = start_idx + page_size

    records = df.iloc[start_idx:end_idx].to_dict(orient="records")

    return {
        "records": records,
        "pagination": {
            "page": current_page,
            "page_size": page_size,
            "total_records": total_records,
            "total_pages": total_pages,
        },
    }


@app.get("/api/analytics", status_code=status.HTTP_200_OK)
def get_analytics():
    """
    Return Pandas preprocessing summary, feature engineering documentation & statistics,
    and a feature engineering table comparing original and derived columns.
    """
    if state.df_engineered is None:
        state.initialize()

    df = state.df_engineered

    engineered_cols = [
        "Attendance_Rate",
        "Task_Completion_Rate",
        "Productivity_Score",
        "Training_Efficiency",
        "Overall_Performance_Score",
    ]
    feature_stats = []
    formulas = {
        "Attendance_Rate": "Present_Days / Working_Days * 100",
        "Task_Completion_Rate": "Completed_Tasks / Assigned_Tasks * 100",
        "Productivity_Score": "Task_Completion_Rate * 0.60 + Quality_Score * 0.40",
        "Training_Efficiency": "(Task_Completion_Rate * 0.65) + (min(Training_Hours, 60)/60 * 35 * Task_Completion_Rate/100)",
        "Overall_Performance_Score": "0.25*Productivity + 0.20*Attendance + 0.20*Quality + 0.15*Deadline + 0.12*(Feedback*20) + 0.08*Training_Eff",
    }
    for col in engineered_cols:
        feature_stats.append(
            {
                "feature": col,
                "formula": formulas[col],
                "mean": round(float(df[col].mean()), 2),
                "std": round(float(df[col].std()), 2),
                "min": round(float(df[col].min()), 2),
                "median": round(float(df[col].median()), 2),
                "max": round(float(df[col].max()), 2),
            }
        )

    exp_counts = df["Experience_Level"].value_counts().to_dict()
    exp_breakdown = []
    for lvl in ["Beginner", "Intermediate", "Experienced"]:
        sub = df[df["Experience_Level"] == lvl]
        exp_breakdown.append(
            {
                "level": lvl,
                "count": int(exp_counts.get(lvl, 0)),
                "avg_productivity": round(float(sub["Productivity_Score"].mean()), 2) if len(sub) > 0 else 0.0,
                "avg_overall_score": round(float(sub["Overall_Performance_Score"].mean()), 2) if len(sub) > 0 else 0.0,
                "avg_training_efficiency": round(float(sub["Training_Efficiency"].mean()), 2) if len(sub) > 0 else 0.0,
            }
        )

    table_cols = [
        "Employee_ID",
        "Employee_Name",
        "Department",
        "Present_Days",
        "Working_Days",
        "Attendance_Rate",
        "Completed_Tasks",
        "Assigned_Tasks",
        "Task_Completion_Rate",
        "Quality_Score",
        "Productivity_Score",
        "Experience_Years",
        "Experience_Level",
        "Training_Hours",
        "Training_Efficiency",
        "Overall_Performance_Score",
        "Performance_Category",
    ]
    sample_table = df[table_cols].head(25).to_dict(orient="records")

    return {
        "cleaning_summary": state.cleaning_summary,
        "feature_stats": feature_stats,
        "experience_level_breakdown": exp_breakdown,
        "feature_engineering_table": sample_table,
    }


@app.get("/api/model/evaluation", status_code=status.HTTP_200_OK)
def get_model_evaluation():
    """Return actual Scikit-learn RandomForestClassifier evaluation metrics."""
    if not state.evaluation_metrics:
        state.initialize()
    return state.evaluation_metrics


@app.get("/api/model/feature-importance", status_code=status.HTTP_200_OK)
def get_feature_importance():
    """Return Random Forest feature importance rankings."""
    if not state.ml_model.feature_importances:
        state.initialize()
    return {
        "model": "RandomForestClassifier",
        "n_estimators": 100,
        "feature_importances": state.ml_model.feature_importances,
    }


@app.post("/api/predict", status_code=status.HTTP_200_OK)
def predict_performance(request: PredictionRequest):
    """Predict performance category for an individual employee using the trained Random Forest model."""
    try:
        result = state.ml_model.predict_employee(request.dict())
        return result
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Prediction error: {str(exc)}",
        )


@app.post("/api/upload", status_code=status.HTTP_200_OK)
async def upload_dataset(file: UploadFile = File(...)):
    """
    Accept a CSV file upload, validate required columns, run Pandas preprocessing
    and feature engineering, and retrain the Random Forest classifier.
    """
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file format. Please upload a valid .csv file.",
        )

    try:
        contents = await file.read()
        df_uploaded = pd.read_csv(io.BytesIO(contents))
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unable to parse CSV file: {str(exc)}",
        )

    if len(df_uploaded) < 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded CSV must contain at least 10 employee records for stratified training.",
        )

    is_valid, missing_cols = validate_columns(df_uploaded)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "message": "Uploaded CSV is missing required columns.",
                "missing_columns": missing_cols,
                "required_columns": REQUIRED_COLUMNS,
            },
        )

    try:
        state.load_custom_dataframe(df_uploaded)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error processing uploaded dataset: {str(exc)}",
        )

    return {
        "message": "Dataset uploaded, cleaned, engineered, and model retrained successfully.",
        "cleaning_summary": state.cleaning_summary,
        "model_accuracy_pct": state.evaluation_metrics.get("accuracy_pct", 0.0),
        "total_records": int(len(state.df_engineered)),
    }


@app.get("/api/download/raw", status_code=status.HTTP_200_OK)
def download_raw_csv():
    """Download the raw synthetic sample employee dataset as CSV."""
    if state.df_raw is None:
        state.initialize()
    csv_bytes = state.df_raw.to_csv(index=False).encode("utf-8")
    return Response(
        content=csv_bytes,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=sample_employee_dataset_raw.csv"},
    )


@app.get("/api/download/processed", status_code=status.HTTP_200_OK)
def download_processed_csv():
    """Download the Pandas-cleaned and feature-engineered employee dataset as CSV."""
    if state.df_engineered is None:
        state.initialize()
    csv_bytes = state.df_engineered.to_csv(index=False).encode("utf-8")
    return Response(
        content=csv_bytes,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=processed_employee_analytics.csv"},
    )


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
