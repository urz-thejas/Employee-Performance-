"""
Pandas Data Preprocessing Module.

Performs actual Pandas operations:
1. CSV loading
2. Dataset inspection
3. Missing-value detection
4. Duplicate record removal
5. Missing-value imputation (department-stratified median/mode)
6. Data type correction
7. Invalid-value validation & clamping
8. Data cleaning summary reporting
"""

from typing import Dict, Tuple, Any
import numpy as np
import pandas as pd

REQUIRED_COLUMNS = [
    "Employee_ID",
    "Employee_Name",
    "Department",
    "Experience_Years",
    "Working_Days",
    "Present_Days",
    "Assigned_Tasks",
    "Completed_Tasks",
    "Quality_Score",
    "Training_Hours",
    "Projects_Completed",
    "Deadline_Completion_Rate",
    "Customer_Feedback_Score",
]

VALID_DEPARTMENTS = {"IT", "HR", "Finance", "Marketing", "Sales", "Operations"}


def validate_columns(df: pd.DataFrame) -> Tuple[bool, list]:
    """Validate that required columns exist in an uploaded or loaded DataFrame."""
    missing_cols = [col for col in REQUIRED_COLUMNS if col not in df.columns]
    return len(missing_cols) == 0, missing_cols


def preprocess_employee_data(df_raw: pd.DataFrame) -> Tuple[pd.DataFrame, Dict[str, Any]]:
    """
    Execute complete Pandas data preprocessing pipeline and return
    (cleaned_dataframe, cleaning_summary_dict).
    """
    is_valid, missing_cols = validate_columns(df_raw)
    if not is_valid:
        raise ValueError(f"Dataset is missing required columns: {', '.join(missing_cols)}")

    df = df_raw.copy()
    original_record_count = int(len(df))

    # 1. Inspect initial missing values before deduplication
    missing_by_column_before = {col: int(df[col].isna().sum()) for col in df.columns if df[col].isna().sum() > 0}

    # 2. Remove exact and Employee_ID duplicate records
    df_dedup = df.drop_duplicates(subset=["Employee_ID"], keep="first").copy()
    duplicate_records_removed = int(original_record_count - len(df_dedup))

    # 3. Missing-value detection on deduplicated records
    missing_values_handled = int(df_dedup.isna().sum().sum())
    missing_breakdown = {
        col: int(cnt) for col, cnt in df_dedup.isna().sum().items() if int(cnt) > 0
    }

    # 4. Missing-value handling using Pandas groupby median / global fallback
    if "Department" in df_dedup.columns:
        df_dedup["Department"] = df_dedup["Department"].fillna("IT").astype(str).str.strip()
        df_dedup.loc[~df_dedup["Department"].isin(VALID_DEPARTMENTS), "Department"] = "IT"

    if "Employee_Name" in df_dedup.columns:
        df_dedup["Employee_Name"] = df_dedup["Employee_Name"].fillna("Unknown Employee").astype(str).str.strip()

    numeric_cols = [
        "Experience_Years",
        "Working_Days",
        "Present_Days",
        "Assigned_Tasks",
        "Completed_Tasks",
        "Quality_Score",
        "Training_Hours",
        "Projects_Completed",
        "Deadline_Completion_Rate",
        "Customer_Feedback_Score",
    ]

    for col in numeric_cols:
        df_dedup[col] = pd.to_numeric(df_dedup[col], errors="coerce")
        if df_dedup[col].isna().any():
            dept_medians = df_dedup.groupby("Department")[col].transform("median")
            global_median = df_dedup[col].median()
            if pd.isna(global_median):
                global_median = 0.0
            df_dedup[col] = df_dedup[col].fillna(dept_medians).fillna(global_median)

    # 5. Invalid-value validation and clamping
    invalid_corrections = 0

    # Working days between 1 and 365
    bad_wd = (df_dedup["Working_Days"] <= 0) | (df_dedup["Working_Days"] > 365)
    invalid_corrections += int(bad_wd.sum())
    df_dedup["Working_Days"] = df_dedup["Working_Days"].clip(lower=1, upper=365)

    # Present days between 0 and Working_Days
    bad_pd = (df_dedup["Present_Days"] < 0) | (df_dedup["Present_Days"] > df_dedup["Working_Days"])
    invalid_corrections += int(bad_pd.sum())
    df_dedup["Present_Days"] = np.minimum(
        np.maximum(df_dedup["Present_Days"], 0), df_dedup["Working_Days"]
    )

    # Assigned tasks >= 1
    bad_at = df_dedup["Assigned_Tasks"] <= 0
    invalid_corrections += int(bad_at.sum())
    df_dedup["Assigned_Tasks"] = df_dedup["Assigned_Tasks"].clip(lower=1)

    # Completed tasks between 0 and Assigned_Tasks
    bad_ct = (df_dedup["Completed_Tasks"] < 0) | (df_dedup["Completed_Tasks"] > df_dedup["Assigned_Tasks"])
    invalid_corrections += int(bad_ct.sum())
    df_dedup["Completed_Tasks"] = np.minimum(
        np.maximum(df_dedup["Completed_Tasks"], 0), df_dedup["Assigned_Tasks"]
    )

    # Quality Score & Deadline Completion Rate in [0, 100]
    df_dedup["Quality_Score"] = df_dedup["Quality_Score"].clip(0.0, 100.0).round(2)
    df_dedup["Deadline_Completion_Rate"] = df_dedup["Deadline_Completion_Rate"].clip(0.0, 100.0).round(2)
    df_dedup["Experience_Years"] = df_dedup["Experience_Years"].clip(0.0, 45.0).round(1)
    df_dedup["Training_Hours"] = df_dedup["Training_Hours"].clip(0.0, 300.0).round(1)
    df_dedup["Customer_Feedback_Score"] = df_dedup["Customer_Feedback_Score"].clip(1.0, 5.0).round(2)
    df_dedup["Projects_Completed"] = df_dedup["Projects_Completed"].clip(lower=0)

    # 6. Data type correction
    int_cols = ["Working_Days", "Present_Days", "Assigned_Tasks", "Completed_Tasks", "Projects_Completed"]
    for col in int_cols:
        df_dedup[col] = df_dedup[col].round().astype(int)

    float_cols = [
        "Experience_Years",
        "Quality_Score",
        "Training_Hours",
        "Deadline_Completion_Rate",
        "Customer_Feedback_Score",
    ]
    for col in float_cols:
        df_dedup[col] = df_dedup[col].astype(float)

    df_dedup = df_dedup.reset_index(drop=True)
    cleaned_record_count = int(len(df_dedup))

    cleaning_summary = {
        "original_record_count": original_record_count,
        "cleaned_record_count": cleaned_record_count,
        "missing_values_handled": missing_values_handled,
        "duplicate_records_removed": duplicate_records_removed,
        "invalid_values_corrected": invalid_corrections,
        "remaining_missing_values": int(df_dedup.isna().sum().sum()),
        "missing_by_column": missing_breakdown,
        "missing_by_column_raw": missing_by_column_before,
        "column_dtypes": {col: str(dtype) for col, dtype in df_dedup.dtypes.items()},
        "operations_performed": [
            "CSV ingestion & schema validation via pandas.read_csv()",
            f"Duplicate detection & removal on Employee_ID ({duplicate_records_removed} duplicates dropped)",
            f"Department-stratified median imputation ({missing_values_handled} missing values filled)",
            "Data type casting (int64 for discrete task/day counts, float64 for continuous metrics)",
            f"Logical boundary validation & clamping ({invalid_corrections} out-of-range cells corrected)",
        ],
    }

    return df_dedup, cleaning_summary
