import React, { useState, useEffect } from 'react';
import {
  Database,
  CheckCircle2,
  FileSpreadsheet,
  Layers,
  CopyX,
  Wrench,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { fetchAnalytics, getProcessedCsvDownloadUrl } from '../services/api';
import StatusBadge from '../components/StatusBadge';

export default function PerformanceAnalyticsPage({ refreshTrigger }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchAnalytics()
      .then((res) => {
        if (active) {
          setData(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (active) {
          setError(err?.response?.data?.detail || err.message || 'Failed to load analytics');
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [refreshTrigger]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-slate-500">
        Running Pandas preprocessing & feature engineering inspection...
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-rose-700">
        {String(error)}
      </div>
    );
  }

  const summary = data?.cleaning_summary || {};
  const featureStats = data?.feature_stats || [];
  const expBreakdown = data?.experience_level_breakdown || [];
  const tableRows = data?.feature_engineering_table || [];

  const cleaningCards = [
    {
      label: 'Original Record Count',
      value: (summary.original_record_count || 0).toLocaleString(),
      sub: 'Raw CSV rows loaded via pd.read_csv()',
      icon: Database,
      color: 'text-slate-700 bg-slate-100',
    },
    {
      label: 'Cleaned Record Count',
      value: (summary.cleaned_record_count || 0).toLocaleString(),
      sub: 'Validated unique employee records',
      icon: CheckCircle2,
      color: 'text-emerald-700 bg-emerald-50',
    },
    {
      label: 'Missing Values Handled',
      value: (summary.missing_values_handled || 0).toLocaleString(),
      sub: 'Imputed via department-stratified medians',
      icon: Wrench,
      color: 'text-blue-700 bg-blue-50',
    },
    {
      label: 'Duplicate Records Removed',
      value: (summary.duplicate_records_removed || 0).toLocaleString(),
      sub: 'Dropped via df.drop_duplicates("Employee_ID")',
      icon: CopyX,
      color: 'text-amber-700 bg-amber-50',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Section 1: Pandas Data Preprocessing Summary */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
              Step 1 &bull; Pandas Data Manipulation
            </span>
            <h3 className="text-base font-bold text-slate-900 mt-0.5">
              Pandas Data Cleaning & Preprocessing Summary
            </h3>
          </div>
          <a
            href={getProcessedCsvDownloadUrl()}
            download="processed_employee_analytics.csv"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Download Processed CSV
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          {cleaningCards.map((c) => {
            const Icon = c.icon;
            return (
              <div key={c.label} className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500">{c.label}</span>
                  <span className={`p-2 rounded-lg ${c.color}`}>
                    <Icon className="w-4 h-4" />
                  </span>
                </div>
                <p className="text-2xl font-bold text-slate-900 mt-2">{c.value}</p>
                <p className="text-[11px] text-slate-500 mt-1">{c.sub}</p>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-5">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2.5">
              Executed Pandas Pipeline Operations
            </h4>
            <ul className="space-y-2 text-xs text-slate-700">
              {(summary.operations_performed || []).map((op, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{op}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2.5">
              Missing Values Imputed by Column
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {Object.entries(summary.missing_by_column || {}).map(([col, count]) => (
                <div
                  key={col}
                  className="bg-white p-2.5 rounded-lg border border-slate-200 flex items-center justify-between"
                >
                  <span className="text-xs font-medium text-slate-700 truncate pr-2" title={col}>
                    {col.replace(/_/g, ' ')}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700">
                    {count} fixed
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Engineered Features Formulas & Experience Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs">
          <div className="mb-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-600">
              Step 2 &bull; Feature Engineering
            </span>
            <h3 className="text-base font-bold text-slate-900 mt-0.5">
              Engineered Feature Formulas & Distribution Statistics
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase">
                  <th className="py-2.5 px-3">Derived Feature</th>
                  <th className="py-2.5 px-3">Mathematical Formula</th>
                  <th className="py-2.5 px-3 text-right">Mean</th>
                  <th className="py-2.5 px-3 text-right">Std</th>
                  <th className="py-2.5 px-3 text-right">Min</th>
                  <th className="py-2.5 px-3 text-right">Max</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {featureStats.map((f) => (
                  <tr key={f.feature} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-semibold text-blue-700">{f.feature}</td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">{f.formula}</td>
                    <td className="py-2.5 px-3 text-right font-semibold">{f.mean}</td>
                    <td className="py-2.5 px-3 text-right text-slate-500">{f.std}</td>
                    <td className="py-2.5 px-3 text-right text-slate-500">{f.min}</td>
                    <td className="py-2.5 px-3 text-right text-slate-500">{f.max}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs">
          <div className="mb-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
              Categorical Derivation
            </span>
            <h3 className="text-base font-bold text-slate-900 mt-0.5">
              Experience_Level Cohort Performance
            </h3>
          </div>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={expBreakdown} margin={{ top: 10, right: 15, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="level" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: '8px', borderColor: '#cbd5e1' }} />
                <Legend />
                <Bar dataKey="avg_productivity" name="Avg Productivity" fill="#2563eb" radius={[4, 4, 0, 0]} />
                <Bar dataKey="avg_training_efficiency" name="Training Efficiency" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                <Bar dataKey="avg_overall_score" name="Overall Score" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Section 3: Feature Engineering Comparison Table (Original vs Derived Columns) */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Feature Engineering Inspection Table (Original vs. Derived Columns)
              </h3>
              <p className="text-xs text-slate-500">
                Side-by-side comparison of raw employee inputs and the 6 Pandas-engineered features
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200">
            6 Engineered Columns Highlighted
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold uppercase text-slate-500">
                <th className="py-3 px-3">ID</th>
                <th className="py-3 px-3">Employee</th>
                <th className="py-3 px-3 text-right">Present / Working</th>
                <th className="py-3 px-3 text-right bg-blue-50/70 text-blue-800">
                  Attendance_Rate
                </th>
                <th className="py-3 px-3 text-right">Completed / Assigned</th>
                <th className="py-3 px-3 text-right bg-blue-50/70 text-blue-800">
                  Task_Completion_Rate
                </th>
                <th className="py-3 px-3 text-right">Quality</th>
                <th className="py-3 px-3 text-right bg-cyan-50/70 text-cyan-900">
                  Productivity_Score
                </th>
                <th className="py-3 px-3 text-right">Exp (Yrs)</th>
                <th className="py-3 px-3 bg-indigo-50/70 text-indigo-900">Experience_Level</th>
                <th className="py-3 px-3 text-right">Train (Hrs)</th>
                <th className="py-3 px-3 text-right bg-blue-50/70 text-blue-800">
                  Training_Efficiency
                </th>
                <th className="py-3 px-3 text-right bg-emerald-50/70 text-emerald-900">
                  Overall_Score
                </th>
                <th className="py-3 px-3">Target Class</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80">
              {tableRows.map((r) => (
                <tr key={r.Employee_ID} className="hover:bg-slate-50/80">
                  <td className="py-2.5 px-3 font-mono font-semibold text-blue-600">
                    {r.Employee_ID}
                  </td>
                  <td className="py-2.5 px-3 font-medium text-slate-900">{r.Employee_Name}</td>
                  <td className="py-2.5 px-3 text-right text-slate-500">
                    {r.Present_Days} / {r.Working_Days}
                  </td>
                  <td className="py-2.5 px-3 text-right font-semibold bg-blue-50/30 text-blue-700">
                    {r.Attendance_Rate}%
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-500">
                    {r.Completed_Tasks} / {r.Assigned_Tasks}
                  </td>
                  <td className="py-2.5 px-3 text-right font-semibold bg-blue-50/30 text-blue-700">
                    {r.Task_Completion_Rate}%
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-600">{r.Quality_Score}</td>
                  <td className="py-2.5 px-3 text-right font-bold bg-cyan-50/30 text-cyan-800">
                    {r.Productivity_Score}
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-600">{r.Experience_Years}</td>
                  <td className="py-2.5 px-3 font-medium bg-indigo-50/30 text-indigo-800">
                    {r.Experience_Level}
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-600">{r.Training_Hours}h</td>
                  <td className="py-2.5 px-3 text-right font-semibold bg-blue-50/30 text-blue-700">
                    {r.Training_Efficiency}
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold bg-emerald-50/30 text-emerald-800">
                    {r.Overall_Performance_Score}
                  </td>
                  <td className="py-2.5 px-3">
                    <StatusBadge category={r.Performance_Category} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
