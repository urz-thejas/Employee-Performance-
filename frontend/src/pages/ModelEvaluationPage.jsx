import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Target,
  Activity,
  Award,
  Layers,
  Cpu,
  AlertTriangle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';
import { fetchModelEvaluation } from '../services/api';
import StatusBadge from '../components/StatusBadge';

export default function ModelEvaluationPage({ refreshTrigger }) {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchModelEvaluation()
      .then((res) => {
        if (active) {
          setMetrics(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (active) {
          setError(err?.response?.data?.detail || err.message || 'Failed to load model metrics');
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
        Loading Scikit-learn RandomForestClassifier evaluation metrics...
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-rose-700">
        {String(error || 'Evaluation metrics unavailable')}
      </div>
    );
  }

  const metricCards = [
    {
      label: 'Test Set Accuracy',
      value: `${metrics.accuracy_pct}%`,
      raw: `Raw: ${metrics.accuracy}`,
      sub: `Evaluated on ${metrics.test_samples} held-out test records`,
      icon: Target,
      color: 'text-emerald-600 bg-emerald-50',
    },
    {
      label: 'Weighted Precision',
      value: `${metrics.precision_pct}%`,
      raw: `Raw: ${metrics.precision}`,
      sub: `Macro avg: ${(metrics.macro_avg?.precision * 100).toFixed(2)}%`,
      icon: ShieldCheck,
      color: 'text-blue-600 bg-blue-50',
    },
    {
      label: 'Weighted Recall',
      value: `${metrics.recall_pct}%`,
      raw: `Raw: ${metrics.recall}`,
      sub: `Macro avg: ${(metrics.macro_avg?.recall * 100).toFixed(2)}%`,
      icon: Activity,
      color: 'text-cyan-600 bg-cyan-50',
    },
    {
      label: 'Weighted F1-Score',
      value: `${metrics.f1_score_pct}%`,
      raw: `Raw: ${metrics.f1_score}`,
      sub: `Harmonic mean of Precision & Recall`,
      icon: Award,
      color: 'text-indigo-600 bg-indigo-50',
    },
  ];

  const labels = metrics.class_labels || ['High', 'Medium', 'Needs Support'];
  const cm = metrics.confusion_matrix || [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ];

  return (
    <div className="space-y-6">
      {/* Synthetic Evaluation Disclosure */}
      <div className="bg-slate-900 text-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-slate-800">
        <div className="flex items-start gap-3">
          <Cpu className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed">
            <span className="font-bold text-white">Genuine Scikit-Learn Pipeline: </span>
            Trained with{' '}
            <code className="text-cyan-300 font-mono">
              RandomForestClassifier(n_estimators=100, random_state=42)
            </code>{' '}
            on an 80/20 stratified split ({metrics.train_samples} train / {metrics.test_samples}{' '}
            test). Target column (<code className="text-amber-300 font-mono">Performance_Category</code>)
            and composite summary score are strictly excluded from input features to prevent target
            leakage.
          </div>
        </div>
        <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shrink-0">
          Zero Data Leakage
        </span>
      </div>

      {/* 4 Core Evaluation Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {c.label}
                </span>
                <span className={`p-2 rounded-lg ${c.color}`}>
                  <Icon className="w-4 h-4" />
                </span>
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl font-bold text-slate-900">{c.value}</span>
                <span className="text-xs font-mono text-slate-400">({c.raw})</span>
              </div>
              <p className="text-xs text-slate-500 mt-2">{c.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Confusion Matrix + Classification Report */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Confusion Matrix */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs">
          <div className="mb-4">
            <h3 className="text-base font-bold text-slate-900">
              Confusion Matrix (20% Stratified Test Split)
            </h3>
            <p className="text-xs text-slate-500">
              Rows represent actual ground-truth classes; columns represent model predictions
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr>
                  <th className="p-2.5 bg-slate-50 border border-slate-200 text-slate-500 font-semibold">
                    Actual \ Predicted
                  </th>
                  {labels.map((lbl) => (
                    <th
                      key={lbl}
                      className="p-2.5 bg-slate-50 border border-slate-200 text-center font-bold text-slate-700"
                    >
                      Pred: {lbl}
                    </th>
                  ))}
                  <th className="p-2.5 bg-slate-100 border border-slate-200 text-center font-bold text-slate-700">
                    Row Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {cm.map((row, rIdx) => {
                  const rowSum = row.reduce((a, b) => a + b, 0);
                  return (
                    <tr key={labels[rIdx]}>
                      <td className="p-3 bg-slate-50 border border-slate-200 font-bold text-slate-800">
                        Actual: {labels[rIdx]}
                      </td>
                      {row.map((val, cIdx) => {
                        const isDiag = rIdx === cIdx;
                        return (
                          <td
                            key={cIdx}
                            className={`p-3 border border-slate-200 text-center font-mono text-sm ${
                              isDiag
                                ? 'bg-blue-600 text-white font-bold'
                                : val > 0
                                ? 'bg-amber-50 text-amber-900 font-semibold'
                                : 'bg-white text-slate-400'
                            }`}
                          >
                            <div>{val}</div>
                            <div
                              className={`text-[10px] ${
                                isDiag ? 'text-blue-100' : 'text-slate-400'
                              }`}
                            >
                              {rowSum > 0 ? `${((val / rowSum) * 100).toFixed(1)}%` : '0%'}
                            </div>
                          </td>
                        );
                      })}
                      <td className="p-3 bg-slate-50 border border-slate-200 text-center font-bold text-slate-700">
                        {rowSum}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Classification Report */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs">
          <div className="mb-4">
            <h3 className="text-base font-bold text-slate-900">
              Per-Class Classification Report
            </h3>
            <p className="text-xs text-slate-500">
              Precision, Recall, F1-Score, and sample support per performance tier
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase">
                  <th className="py-3 px-4">Class</th>
                  <th className="py-3 px-4 text-right">Precision</th>
                  <th className="py-3 px-4 text-right">Recall</th>
                  <th className="py-3 px-4 text-right">F1-Score</th>
                  <th className="py-3 px-4 text-right">Support</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {(metrics.classification_report || []).map((row) => (
                  <tr key={row.category} className="hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <StatusBadge category={row.category} />
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-slate-800">
                      {(row.precision * 100).toFixed(2)}%
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-slate-800">
                      {(row.recall * 100).toFixed(2)}%
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-blue-700">
                      {(row.f1_score * 100).toFixed(2)}%
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-600">
                      {row.support}
                    </td>
                  </tr>
                ))}
                <tr className="bg-slate-50 font-semibold text-xs text-slate-700">
                  <td className="py-2.5 px-4">Macro Average</td>
                  <td className="py-2.5 px-4 text-right font-mono">
                    {(metrics.macro_avg?.precision * 100).toFixed(2)}%
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono">
                    {(metrics.macro_avg?.recall * 100).toFixed(2)}%
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono">
                    {(metrics.macro_avg?.f1_score * 100).toFixed(2)}%
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono">{metrics.test_samples}</td>
                </tr>
                <tr className="bg-blue-50/50 font-bold text-xs text-blue-900">
                  <td className="py-2.5 px-4">Weighted Average</td>
                  <td className="py-2.5 px-4 text-right font-mono">
                    {(metrics.weighted_avg?.precision * 100).toFixed(2)}%
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono">
                    {(metrics.weighted_avg?.recall * 100).toFixed(2)}%
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono">
                    {(metrics.weighted_avg?.f1_score * 100).toFixed(2)}%
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono">{metrics.test_samples}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Feature Importance Ranking Chart & Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Random Forest Feature Importance Analysis
              </h3>
              <p className="text-xs text-slate-500">
                Mean decrease in Gini impurity across all 100 decision trees in the ensemble
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-7 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={metrics.feature_importances || []}
                layout="vertical"
                margin={{ top: 5, right: 25, left: 40, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" unit="%" tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="label" width={145} tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(v) => [`${v}%`, 'Relative Importance']}
                  contentStyle={{ borderRadius: '8px', borderColor: '#cbd5e1' }}
                />
                <Bar dataKey="importance_pct" name="Importance %" radius={[0, 6, 6, 0]}>
                  {(metrics.feature_importances || []).map((entry, index) => (
                    <Cell
                      key={entry.feature}
                      fill={index === 0 ? '#1d4ed8' : index < 4 ? '#0284c7' : '#06b6d4'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="lg:col-span-5">
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase">
                    <th className="py-2.5 px-3">Rank</th>
                    <th className="py-2.5 px-3">Input Feature</th>
                    <th className="py-2.5 px-3 text-right">Importance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {(metrics.feature_importances || []).map((fi, idx) => (
                    <tr key={fi.feature} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-mono font-bold text-slate-500">#{idx + 1}</td>
                      <td className="py-2 px-3 font-medium text-slate-900">{fi.feature}</td>
                      <td className="py-2 px-3 text-right font-mono font-semibold text-blue-700">
                        {fi.importance_pct}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
