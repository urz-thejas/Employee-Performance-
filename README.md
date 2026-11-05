# Employee Performance Analytics System
### Using Pandas Data Manipulation, Feature Engineering, and Scikit-learn Classification

## 1. Project Abstract
The **Employee Performance Analytics System** is a full-stack HR Analytics and Machine Learning decision-support application engineered for academic demonstration and cloud deployment. It integrates a **Python FastAPI** backend with **Pandas** data preprocessing, domain-driven **Feature Engineering**, and a **Scikit-learn `RandomForestClassifier`** pipeline, paired with an enterprise **React 18 + Vite + Tailwind CSS + Recharts** interactive dashboard.

> **Synthetic Academic Data Disclaimer:** All 1,000 employee records in this system are synthetically generated using a documented, consistent multi-factor mathematical rule. Model evaluation metrics and predictions are illustrative decision-support outputs on synthetic academic data and do not represent real-world workplace prediction accuracy or automated HR decisions.

## 2. Objectives
1. Demonstrate real **Pandas data manipulation** including CSV loading, missing-value detection & department-stratified median imputation, duplicate removal, data type enforcement, and boundary clamping.
2. Construct 6 domain-specific **engineered HR features** safely handling division by zero and invalid inputs.
3. Train and evaluate a leakage-free **Scikit-learn `RandomForestClassifier`** (`n_estimators=100, random_state=42`) using an 80/20 stratified train/test split.
4. Provide an interactive **React + Recharts** executive dashboard with live backend integration, searchable/paginated employee records, CSV upload/export, and real-time individual performance prediction.
5. Prepare production deployment configurations for **GitHub**, **Vercel** (Frontend), and **Render** (Backend).

## 3. Technologies Used
| Layer | Technology Stack |
| :--- | :--- |
| **Frontend** | React 18, Vite 5, Tailwind CSS 3, Recharts 2, Lucide React, Axios |
| **Backend** | Python 3.11+, FastAPI, Uvicorn, Pydantic |
| **Data Science & ML** | Pandas, NumPy, Scikit-learn (`RandomForestClassifier`, `train_test_split`), Joblib |
| **Testing** | Pytest, FastAPI `TestClient` (`httpx`) |
| **Deployment** | GitHub (Version Control), Vercel (Frontend Hosting), Render (Python Web Service) |

## 4. System Architecture
```
employee-performance-analytics/
│
├── frontend/                        # React 18 + Vite + Tailwind CSS + Recharts SPA
│   ├── src/
│   │   ├── components/
│   │   │   ├── Sidebar.jsx          # Dark navy enterprise navigation sidebar
│   │   │   ├── Header.jsx           # Live API health indicator + CSV upload/export
│   │   │   └── StatusBadge.jsx      # High / Medium / Needs Support category pills
│   │   ├── pages/
│   │   │   ├── OverviewPage.jsx     # 6 KPI cards, 5 Recharts charts, filters & recent records
│   │   │   ├── EmployeeRecordsPage.jsx # Paginated, sortable, filterable employee directory
│   │   │   ├── PerformanceAnalyticsPage.jsx # Pandas cleaning telemetry & Feature Engineering table
│   │   │   ├── PredictionPage.jsx   # Interactive ML predictor + probability & feature importance
│   │   │   ├── ModelEvaluationPage.jsx # Accuracy, Precision, Recall, F1, Confusion Matrix
│   │   │   └── AboutProjectPage.jsx # System documentation & academic disclosures
│   │   ├── services/
│   │   │   └── api.js               # Axios client configured with VITE_API_URL
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── .env.example
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── index.html
│
├── backend/                         # Python FastAPI + Pandas + Scikit-learn server
│   ├── main.py                      # FastAPI REST endpoints & CORS configuration
│   ├── dataset_generator.py         # Generates 1,000 unique synthetic records (+ dirty rows)
│   ├── preprocessing.py             # Pandas cleaning, deduplication, imputation & validation
│   ├── feature_engineering.py       # Derives 6 HR features safely handling zero division
│   ├── model.py                     # RandomForestClassifier (80/20 stratified split)
│   ├── requirements.txt             # Python dependencies for local & Render deployment
│   ├── data/                        # Raw CSV, Processed CSV, and persisted Joblib model
│   └── tests/
│       └── test_api.py              # Automated Pytest suite
│
├── .gitignore
├── README.md
├── vercel.json                      # Vercel frontend configuration
└── render.yaml                      # Render Python web service blueprint
```

## 5. Features Implemented
- **Executive Overview Dashboard**: Displays 6 real-time KPI cards (*Total Employees, Average Attendance, Average Productivity, Average Quality Score, High Performers, Employees Needing Support*), 5 interactive Recharts visualizations (*Performance Category Distribution Bar Chart, Performance Distribution Pie Chart, Department-wise Performance, Attendance vs Productivity Scatter Plot, Employee Productivity Comparison*), dynamic cohort filters, and recent employee records.
- **Employee Records Directory**: Search by Employee ID or Name, filter by Department (`IT, HR, Finance, Marketing, Sales, Operations`) and Category (`High, Medium, Needs Support`), multi-column sorting, pagination, custom CSV upload (`POST /api/upload`), and filtered/full CSV export.
- **Pandas Preprocessing & Feature Engineering View**: Displays original record count (`1,018`), cleaned record count (`1,000`), missing values imputed (`32`), duplicate records removed (`18`), boundary anomalies corrected (`5`), and a side-by-side Feature Engineering table comparing raw and derived columns.
- **Interactive ML Performance Predictor**: Validates 8 user inputs, runs the trained 100-tree Random Forest classifier via `POST /api/predict`, and displays predicted category, class probabilities, engineered indicators, and feature importance bars.
- **Model Evaluation Suite**: Displays actual test-set Accuracy (`93.50%`), Precision (`93.49%`), Recall (`93.50%`), F1-score (`93.47%`), 3x3 Confusion Matrix, per-class Classification Report, and Gini Feature Importance rankings.

## 6. Dataset Description
The synthetic generator (`backend/dataset_generator.py`) creates **1,000 unique employee profiles** (`EMP-1001` to `EMP-2000`) across 6 departments (`IT`, `HR`, `Finance`, `Marketing`, `Sales`, `Operations`) with 14 attributes:
`Employee_ID`, `Employee_Name`, `Department`, `Experience_Years`, `Working_Days`, `Present_Days`, `Assigned_Tasks`, `Completed_Tasks`, `Quality_Score`, `Training_Hours`, `Projects_Completed`, `Deadline_Completion_Rate`, `Customer_Feedback_Score`, and `Performance_Category`.

To demonstrate real Pandas data cleaning, the generator injects **18 duplicate rows** (producing `1,018` raw CSV rows), **32 missing values** across numeric columns, and **5 out-of-range anomalies**.

### Consistent Synthetic Labeling Rule (Zero Target Leakage)
Target labels (`High`, `Medium`, `Needs Support`) are generated from a consistent latent behavioral composite formula with natural Gaussian workplace variance ($\epsilon \sim \mathcal{N}(0, 1.5)$):
$$\text{Composite} = 0.22(\text{Attendance\%}) + 0.26(\text{Task\%}) + 0.22(\text{Quality}) + 0.14(\text{Deadline\%}) + 0.10(20 \times \text{Feedback}) + 0.06\min(100, 8\cdot\text{Projects} + 0.4\cdot\text{Training}) + \epsilon$$
- **High**: $\text{Composite} \ge 79.5$ (`401` employees)
- **Medium**: $68.5 \le \text{Composite} < 79.5$ (`378` employees)
- **Needs Support**: $\text{Composite} < 68.5$ (`221` employees)

## 7. Pandas Preprocessing Methodology
Implemented in `backend/preprocessing.py`:
1. **CSV Ingestion & Schema Validation**: Loads CSV via `pd.read_csv()` and verifies all required columns exist.
2. **Deduplication**: Drops duplicate `Employee_ID` entries using `df.drop_duplicates(subset=["Employee_ID"], keep="first")`, reducing `1,018` raw rows to `1,000` unique employees.
3. **Missing-Value Detection & Imputation**: Detects `32` missing values via `df.isna().sum()` and imputes numeric gaps using department-stratified medians (`df.groupby("Department")[col].transform("median")`).
4. **Data Type & Boundary Enforcement**: Enforces `int64` for discrete counts and `float64` for continuous metrics, clamping `Present_Days <= Working_Days`, `Completed_Tasks <= Assigned_Tasks`, and percentage scores within `[0, 100]` (`5` anomalies fixed).

## 8. Feature Engineering Methodology
Implemented in `backend/feature_engineering.py` with division-by-zero protection:
1. `Attendance_Rate = (Present_Days / Working_Days) * 100`
2. `Task_Completion_Rate = (Completed_Tasks / Assigned_Tasks) * 100`
3. `Productivity_Score = Task_Completion_Rate * 0.60 + Quality_Score * 0.40`
4. `Experience_Level`: `Beginner` ($<3$ yrs), `Intermediate` ($3\text{–}7$ yrs), `Experienced` ($\ge 7$ yrs)
5. `Training_Efficiency = (Task_Completion_Rate * 0.65) + (min(Training_Hours, 60)/60 * 35 * (Task_Completion_Rate / 100))`
6. `Overall_Performance_Score = 0.25*Productivity_Score + 0.20*Attendance_Rate + 0.20*Quality_Score + 0.15*Deadline_Completion_Rate + 0.12*(Customer_Feedback_Score*20) + 0.08*Training_Efficiency`

## 9. ML Classification Methodology & Evaluation Metrics
Implemented in `backend/model.py`:
- **Classifier**: `RandomForestClassifier(n_estimators=100, random_state=42)`
- **Validation Split**: 80% Training (`800` samples) / 20% Testing (`200` samples) using `train_test_split(..., test_size=0.20, random_state=42, stratify=y)`.
- **Input Features (9)**: `Attendance_Rate`, `Task_Completion_Rate`, `Productivity_Score`, `Quality_Score`, `Training_Hours`, `Experience_Years`, `Deadline_Completion_Rate`, `Customer_Feedback_Score`, `Projects_Completed`.
- **Target Leakage Prevention**: Neither `Performance_Category` nor `Overall_Performance_Score` is included in the feature matrix `X`.
- **Evaluation Metrics on Held-Out Test Split (200 Samples)**:
  - **Accuracy**: `93.50%` (`0.9350`)
  - **Weighted Precision**: `93.49%` (`0.9349`)
  - **Weighted Recall**: `93.50%` (`0.9350`)
  - **Weighted F1-Score**: `93.47%` (`0.9347`)
  - **Macro Avg F1-Score**: `93.57%` (`0.9357`)

## 10. Installation & Local Execution Commands

### Backend Setup (Terminal 1)
```bash
cd employee-performance-analytics/backend
python3 -m venv venv
source venv/bin/activate   # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Generate synthetic dataset (optional: main.py auto-generates if missing)
python3 dataset_generator.py

# Run automated pytest suite
pytest tests/test_api.py

# Start FastAPI server on http://localhost:8000
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend Setup (Terminal 2)
```bash
cd employee-performance-analytics/frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser. Vite proxies `/api/*` requests to `http://localhost:8000`.

## 11. GitHub Push Instructions
```bash
cd employee-performance-analytics
git init
git add .
git commit -m "feat: complete Employee Performance Analytics System MVP"
git branch -M main
git remote add origin https://github.com/<your-username>/employee-performance-analytics.git
git push -u origin main
```

## 12. Render Deployment Instructions (Backend)
1. Log in to [Render](https://render.com/) and click **New +** &rarr; **Web Service** (or **Blueprint** to auto-detect `render.yaml`).
2. Connect your GitHub repository (`employee-performance-analytics`).
3. Configure the service settings:
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Add Environment Variables:
   - `PYTHON_VERSION` = `3.11.8`
   - `CORS_ORIGINS` = `*` (or your Vercel frontend domain, e.g., `https://employee-performance-analytics.vercel.app`)
5. Click **Create Web Service** and copy your live Render URL (e.g., `https://employee-performance-analytics-api.onrender.com`).

## 13. Vercel Deployment Instructions (Frontend)
1. Log in to [Vercel](https://vercel.com/) and click **Add New...** &rarr; **Project**.
2. Import your GitHub repository (`employee-performance-analytics`).
3. Configure the build settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add the required Environment Variable:
   - `VITE_API_URL` = `https://employee-performance-analytics-api.onrender.com` *(Use your actual Render backend URL; never use localhost in production).*
5. Click **Deploy**.

## 14. Limitations & Future Enhancements
- **Limitations**:
  - Uses a synthetic academic dataset stored in flat CSV files rather than a persistent multi-tenant SQL database.
  - Designed as an unauthenticated academic demonstration MVP.
- **Future Enhancements**:
  - Integrate SHAP (SHapley Additive exPlanations) for local instance-level explainability.
  - Add longitudinal quarterly time-series tracking per employee.
  - Add PostgreSQL / Supabase persistence and role-based access control (RBAC) for HR managers.
