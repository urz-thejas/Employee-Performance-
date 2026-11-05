"""
Feature Engineering Module.

Derives 6 HR analytics features from cleaned employee records:
1. Attendance_Rate = Present_Days / Working_Days * 100
2. Task_Completion_Rate = Completed_Tasks / Assigned_Tasks * 100
3. Productivity_Score = Task_Completion_Rate * 0.60 + Quality_Score * 0.40
4. Experience_Level = Beginner (<3 yrs), Intermediate (3-7 yrs), Experienced (>=7 yrs)
5. Training_Efficiency = Documented index combining Task_Completion_Rate and Training_Hours
6. Overall_Performance_Score = Weighted combination of key performance indicators

Safely handles division by zero and out-of-range inputs.
"""

import numpy as np
import pandas as pd


def engineer_features(df_clean: pd.DataFrame) -> pd.DataFrame:
    """Compute all 6 engineered features on a cleaned employee DataFrame."""
    df = df_clean.copy()

    # 1. Attendance_Rate = Present_Days / Working_Days * 100 (safe division)
    working_days_safe = np.where(df["Working_Days"] > 0, df["Working_Days"], 1)
    df["Attendance_Rate"] = np.where(
        df["Working_Days"] > 0,
        (df["Present_Days"] / working_days_safe) * 100.0,
        0.0,
    )
    df["Attendance_Rate"] = np.clip(df["Attendance_Rate"], 0.0, 100.0).round(2)

    # 2. Task_Completion_Rate = Completed_Tasks / Assigned_Tasks * 100 (safe division)
    assigned_tasks_safe = np.where(df["Assigned_Tasks"] > 0, df["Assigned_Tasks"], 1)
    df["Task_Completion_Rate"] = np.where(
        df["Assigned_Tasks"] > 0,
        (df["Completed_Tasks"] / assigned_tasks_safe) * 100.0,
        0.0,
    )
    df["Task_Completion_Rate"] = np.clip(df["Task_Completion_Rate"], 0.0, 100.0).round(2)

    # 3. Productivity_Score = Task_Completion_Rate * 0.60 + Quality_Score * 0.40
    df["Productivity_Score"] = (
        df["Task_Completion_Rate"] * 0.60 + df["Quality_Score"] * 0.40
    ).clip(0.0, 100.0).round(2)

    # 4. Experience_Level: Beginner (<3), Intermediate (3 to <7), Experienced (>=7)
    df["Experience_Level"] = np.where(
        df["Experience_Years"] < 3.0,
        "Beginner",
        np.where(df["Experience_Years"] < 7.0, "Intermediate", "Experienced"),
    )

    # 5. Training_Efficiency:
    # Documented metric measuring task output effectiveness relative to training investment:
    # Combines base task completion (65% weight) with training utilization bonus (35% weight)
    training_factor = np.minimum(df["Training_Hours"].clip(lower=0.0), 60.0) / 60.0
    df["Training_Efficiency"] = (
        (df["Task_Completion_Rate"] * 0.65)
        + (training_factor * 35.0 * (df["Task_Completion_Rate"] / 100.0))
    ).clip(0.0, 100.0).round(2)

    # 6. Overall_Performance_Score:
    # Weighted composite index across core dimensions (for analytics visualization;
    # NOT passed to the ML classifier to avoid target leakage)
    feedback_pct = (df["Customer_Feedback_Score"].clip(1.0, 5.0) / 5.0) * 100.0
    df["Overall_Performance_Score"] = (
        0.25 * df["Productivity_Score"]
        + 0.20 * df["Attendance_Rate"]
        + 0.20 * df["Quality_Score"]
        + 0.15 * df["Deadline_Completion_Rate"]
        + 0.12 * feedback_pct
        + 0.08 * df["Training_Efficiency"]
    ).clip(0.0, 100.0).round(2)

    # If uploaded CSV did not include Performance_Category, derive illustrative category
    if "Performance_Category" not in df.columns:
        df["Performance_Category"] = np.where(
            df["Overall_Performance_Score"] >= 82.0,
            "High",
            np.where(df["Overall_Performance_Score"] >= 69.5, "Medium", "Needs Support"),
        )

    return df


def compute_single_employee_features(payload: dict) -> dict:
    """
    Compute engineered features for a single prediction request payload.
    """
    attendance_rate = float(np.clip(payload["attendance_rate"], 0.0, 100.0))
    task_completion_rate = float(np.clip(payload["task_completion_rate"], 0.0, 100.0))
    quality_score = float(np.clip(payload["quality_score"], 0.0, 100.0))
    training_hours = float(np.clip(payload["training_hours"], 0.0, 300.0))
    experience_years = float(np.clip(payload["experience_years"], 0.0, 45.0))
    projects_completed = int(np.clip(payload["projects_completed"], 0, 100))
    deadline_completion_rate = float(np.clip(payload["deadline_completion_rate"], 0.0, 100.0))
    customer_feedback_score = float(payload["customer_feedback_score"])
    if customer_feedback_score > 5.0:
        customer_feedback_score = float(np.clip(customer_feedback_score / 20.0, 1.0, 5.0))
    else:
        customer_feedback_score = float(np.clip(customer_feedback_score, 1.0, 5.0))

    productivity_score = round(task_completion_rate * 0.60 + quality_score * 0.40, 2)
    if experience_years < 3.0:
        experience_level = "Beginner"
    elif experience_years < 7.0:
        experience_level = "Intermediate"
    else:
        experience_level = "Experienced"

    training_factor = min(max(training_hours, 0.0), 60.0) / 60.0
    training_efficiency = round(
        (task_completion_rate * 0.65) + (training_factor * 35.0 * (task_completion_rate / 100.0)),
        2,
    )
    feedback_pct = (customer_feedback_score / 5.0) * 100.0
    overall_performance_score = round(
        0.25 * productivity_score
        + 0.20 * attendance_rate
        + 0.20 * quality_score
        + 0.15 * deadline_completion_rate
        + 0.12 * feedback_pct
        + 0.08 * training_efficiency,
        2,
    )

    return {
        "Attendance_Rate": round(attendance_rate, 2),
        "Task_Completion_Rate": round(task_completion_rate, 2),
        "Productivity_Score": productivity_score,
        "Quality_Score": round(quality_score, 2),
        "Training_Hours": round(training_hours, 1),
        "Experience_Years": round(experience_years, 1),
        "Deadline_Completion_Rate": round(deadline_completion_rate, 2),
        "Customer_Feedback_Score": round(customer_feedback_score, 2),
        "Projects_Completed": projects_completed,
        "Experience_Level": experience_level,
        "Training_Efficiency": training_efficiency,
        "Overall_Performance_Score": overall_performance_score,
    }
