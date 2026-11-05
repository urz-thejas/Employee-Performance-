"""
Synthetic Academic Employee Performance Dataset Generator.

Generates 1,000 unique synthetic employee records across 6 departments
(IT, HR, Finance, Marketing, Sales, Operations) using a documented, consistent
multi-factor scoring rule with realistic workplace variance. Also injects a
controlled set of duplicate records (18 rows), missing cell values (32 cells),
and out-of-range values (4 cells) into the raw CSV so Pandas data preprocessing
can be authentically demonstrated.

NOTE: This dataset is synthetic academic demonstration data and does not represent
real-world employee records or production HR decision-making accuracy.
"""

import os
import numpy as np
import pandas as pd

DEPARTMENTS = ["IT", "HR", "Finance", "Marketing", "Sales", "Operations"]
DEPT_WEIGHTS = [0.24, 0.12, 0.15, 0.14, 0.19, 0.16]

FIRST_NAMES = [
    "Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Sai", "Rohan", "Karthik",
    "Priya", "Ananya", "Diya", "Sanya", "Neha", "Kavya", "Meera", "Ishita",
    "Rahul", "Vikram", "Nikhil", "Siddharth", "Pooja", "Shruti", "Divya", "Tanvi",
    "Dev", "Harsh", "Pranav", "Varun", "Riya", "Nisha", "Swati", "Sneha",
    "Daniel", "Michael", "Elena", "Sophia", "Lucas", "Olivia", "Marcus", "Chloe"
]

LAST_NAMES = [
    "Sharma", "Verma", "Patel", "Reddy", "Nair", "Iyer", "Kumar", "Singh",
    "Gupta", "Joshi", "Mehta", "Rao", "Desai", "Bhat", "Menon", "Pillai",
    "Chatterjee", "Banerjee", "Kulkarni", "Deshmukh", "Kapoor", "Malhotra",
    "Srinivasan", "Natarajan", "Subramanian", "Krishnan", "Bose", "Sen",
    "Agarwal", "Saxena", "Chauhan", "Tiwari", "Mishra", "Pandey", "Shah", "Das"
]


def generate_employee_dataset(
    output_csv_path: str = None,
    n_unique: int = 1000,
    n_duplicates: int = 18,
    random_seed: int = 42,
) -> pd.DataFrame:
    """
    Generate synthetic employee performance records with a consistent, documented
    multi-factor formula and realistic dirty-data artifacts for Pandas cleaning.
    """
    rng = np.random.RandomState(random_seed)

    if output_csv_path is None:
        base_dir = os.path.dirname(os.path.abspath(__file__))
        data_dir = os.path.join(base_dir, "data")
        os.makedirs(data_dir, exist_ok=True)
        output_csv_path = os.path.join(data_dir, "raw_employee_data.csv")
    else:
        os.makedirs(os.path.dirname(os.path.abspath(output_csv_path)), exist_ok=True)

    employee_ids = [f"EMP-{1001 + i}" for i in range(n_unique)]
    names = [
        f"{rng.choice(FIRST_NAMES)} {rng.choice(LAST_NAMES)}"
        for _ in range(n_unique)
    ]
    departments = rng.choice(DEPARTMENTS, size=n_unique, p=DEPT_WEIGHTS)

    # Generate latent employee capability profile (0.0 to 1.0)
    latent_skill = rng.beta(a=2.8, b=2.2, size=n_unique)

    experience_years = np.round(
        np.clip(rng.gamma(shape=2.6, scale=2.2, size=n_unique) + 0.5, 0.5, 22.0), 1
    )
    working_days = rng.randint(230, 261, size=n_unique)

    # Attendance rate ranges roughly from 64% to 100%
    attendance_ratio = np.clip(
        0.66 + 0.32 * latent_skill + rng.normal(0, 0.04, size=n_unique), 0.60, 1.0
    )
    present_days = np.round(working_days * attendance_ratio).astype(int)
    present_days = np.clip(present_days, 140, working_days)

    assigned_tasks = rng.randint(50, 151, size=n_unique)
    task_completion_ratio = np.clip(
        0.50 + 0.46 * latent_skill + rng.normal(0, 0.05, size=n_unique), 0.42, 1.0
    )
    completed_tasks = np.round(assigned_tasks * task_completion_ratio).astype(int)
    completed_tasks = np.clip(completed_tasks, 20, assigned_tasks)

    quality_score = np.round(
        np.clip(46.0 + 50.0 * latent_skill + rng.normal(0, 4.5, size=n_unique), 40.0, 99.5),
        1,
    )
    training_hours = np.round(
        np.clip(10.0 + 42.0 * latent_skill + rng.normal(0, 8.0, size=n_unique), 5.0, 80.0),
        1,
    )
    projects_completed = np.clip(
        np.round(1.0 + 9.0 * latent_skill + (experience_years * 0.16) + rng.normal(0, 1.1, size=n_unique)),
        1,
        15,
    ).astype(int)

    deadline_completion_rate = np.round(
        np.clip(48.0 + 49.0 * latent_skill + rng.normal(0, 4.8, size=n_unique), 42.0, 100.0),
        1,
    )
    customer_feedback_score = np.round(
        np.clip(2.0 + 2.8 * latent_skill + rng.normal(0, 0.25, size=n_unique), 1.2, 5.0),
        2,
    )

    # Documented Synthetic Scoring Rule (Target Generation)
    actual_attendance_pct = (present_days / working_days) * 100.0
    actual_task_pct = (completed_tasks / assigned_tasks) * 100.0

    synthetic_composite = (
        0.22 * actual_attendance_pct
        + 0.26 * actual_task_pct
        + 0.22 * quality_score
        + 0.14 * deadline_completion_rate
        + 0.10 * (customer_feedback_score * 20.0)
        + 0.06 * np.minimum(100.0, projects_completed * 8.0 + training_hours * 0.4)
        + rng.normal(0, 1.5, size=n_unique)
    )

    performance_category = np.where(
        synthetic_composite >= 79.5,
        "High",
        np.where(synthetic_composite >= 68.5, "Medium", "Needs Support"),
    )

    df = pd.DataFrame(
        {
            "Employee_ID": employee_ids,
            "Employee_Name": names,
            "Department": departments,
            "Experience_Years": experience_years,
            "Working_Days": working_days,
            "Present_Days": present_days,
            "Assigned_Tasks": assigned_tasks,
            "Completed_Tasks": completed_tasks,
            "Quality_Score": quality_score,
            "Training_Hours": training_hours,
            "Projects_Completed": projects_completed,
            "Deadline_Completion_Rate": deadline_completion_rate,
            "Customer_Feedback_Score": customer_feedback_score,
            "Performance_Category": performance_category,
        }
    )

    # Inject controlled missing values (32 cells across numeric columns)
    df_dirty = df.copy()
    nullable_cols = [
        "Experience_Years",
        "Quality_Score",
        "Training_Hours",
        "Deadline_Completion_Rate",
        "Customer_Feedback_Score",
    ]
    missing_rows = rng.choice(n_unique, size=32, replace=False)
    for idx, row_i in enumerate(missing_rows):
        col_name = nullable_cols[idx % len(nullable_cols)]
        df_dirty.loc[row_i, col_name] = np.nan

    # Inject 4 out-of-range anomalies so boundary validation is demonstrated
    if n_unique >= 20:
        df_dirty.loc[0, "Present_Days"] = int(df_dirty.loc[0, "Working_Days"]) + 5
        df_dirty.loc[1, "Completed_Tasks"] = int(df_dirty.loc[1, "Assigned_Tasks"]) + 8
        df_dirty.loc[2, "Working_Days"] = 400
        df_dirty.loc[3, "Assigned_Tasks"] = -5

    # Inject 18 duplicate employee records to demonstrate duplicate removal
    dup_indices = rng.choice(n_unique, size=min(n_duplicates, n_unique), replace=False)
    df_duplicates = df_dirty.iloc[dup_indices].copy()
    df_raw = pd.concat([df_dirty, df_duplicates], ignore_index=True)

    df_raw.to_csv(output_csv_path, index=False)
    return df_raw


if __name__ == "__main__":
    raw_df = generate_employee_dataset()
    print(f"Generated raw dataset with {len(raw_df)} rows.")
    print(raw_df["Performance_Category"].value_counts())
