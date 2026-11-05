import React from 'react';
import {
  Code2,
  Database,
  BrainCircuit,
  Server,
  Globe,
  ShieldAlert,
  CheckCircle2,
  Layers,
} from 'lucide-react';

export default function AboutProjectPage() {
  return (
    <div className="space-y-6">
      {/* Project Abstract Banner */}
      <div className="bg-gradient-to-r from-[#0b1325] via-[#111c35] to-blue-950 text-white rounded-2xl p-6 shadow-md border border-slate-800">
        <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 mb-3">
          Academic Full-Stack Data Science Demonstration
        </span>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
          Employee Performance Analytics System using Pandas Data Manipulation, Feature Engineering,
          and Scikit-learn Classification
        </h2>
        <p className="text-sm text-slate-300 mt-2 max-w-4xl leading-relaxed">
          An end-to-end HR Analytics & Machine Learning decision-support system built with Python
          FastAPI, Pandas, NumPy, Scikit-learn, and React + Tailwind CSS + Recharts. It demonstrates
          synthetic dataset generation, automated missing-value & duplicate cleaning, domain feature
          engineering, and leakage-free Random Forest classification.
        </p>
      </div>

      {/* System Architecture Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
            <Database className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            1. Pandas Data Pipeline & Feature Engineering
          </h3>
          <p className="text-xs text-slate-600 mt-2 leading-relaxed">
            Ingests 1,018 raw employee records, removes 18 duplicate IDs, imputes 32 missing numeric
            values via department-stratified medians, validates logical bounds, and derives 6
            engineered indicators including <code className="font-mono">Attendance_Rate</code>,{' '}
            <code className="font-mono">Task_Completion_Rate</code>, and{' '}
            <code className="font-mono">Productivity_Score</code>.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs">
          <div className="w-10 h-10 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center mb-3">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            2. Scikit-learn Random Forest Classifier
          </h3>
          <p className="text-xs text-slate-600 mt-2 leading-relaxed">
            Trains a 100-tree <code className="font-mono">RandomForestClassifier</code>{' '}
            (<code className="font-mono">random_state=42</code>) using an 80/20 stratified train/test
            split across 9 behavioral and productivity features to classify employees into{' '}
            <strong>High</strong>, <strong>Medium</strong>, or <strong>Needs Support</strong> tiers.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
            <Globe className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            3. Cloud-Native Full-Stack Architecture
          </h3>
          <p className="text-xs text-slate-600 mt-2 leading-relaxed">
            Decoupled REST architecture with a stateless FastAPI + Uvicorn backend configured for{' '}
            <strong>Render</strong> (<code className="font-mono">render.yaml</code>) and a responsive
            React 18 + Vite + Tailwind CSS + Recharts frontend configured for{' '}
            <strong>Vercel</strong> (<code className="font-mono">vercel.json</code>).
          </p>
        </div>
      </div>

      {/* Methodology & Formulas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs">
          <div className="flex items-center gap-2 mb-3">
            <Layers className="w-4 h-4 text-blue-600" />
            <h3 className="text-base font-bold text-slate-900">
              Feature Engineering Specifications
            </h3>
          </div>
          <div className="space-y-3 text-xs text-slate-700">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span className="font-bold text-slate-900 block">
                1. Attendance_Rate (%)
              </span>
              <code className="text-blue-700 font-mono">
                Present_Days / Working_Days * 100
              </code>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span className="font-bold text-slate-900 block">
                2. Task_Completion_Rate (%)
              </span>
              <code className="text-blue-700 font-mono">
                Completed_Tasks / Assigned_Tasks * 100
              </code>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span className="font-bold text-slate-900 block">
                3. Productivity_Score (0 - 100)
              </span>
              <code className="text-blue-700 font-mono">
                Task_Completion_Rate * 0.60 + Quality_Score * 0.40
              </code>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span className="font-bold text-slate-900 block">
                4. Experience_Level (Categorical)
              </span>
              <code className="text-blue-700 font-mono">
                Beginner (&lt;3 yrs) | Intermediate (3-7 yrs) | Experienced (&ge;7 yrs)
              </code>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span className="font-bold text-slate-900 block">
                5. Training_Efficiency &amp; 6. Overall_Performance_Score
              </span>
              <code className="text-blue-700 font-mono">
                Weighted combinations of task output, training utilization, quality, and feedback
              </code>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-cyan-600" />
            <h3 className="text-base font-bold text-slate-900">Technology Stack & API Endpoints</h3>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span className="font-bold text-slate-900 block mb-1">Frontend Stack</span>
              <ul className="space-y-1 text-slate-600">
                <li>&bull; React 18 &amp; Vite 5</li>
                <li>&bull; Tailwind CSS 3</li>
                <li>&bull; Recharts Visualizations</li>
                <li>&bull; Lucide React Icons &amp; Axios</li>
              </ul>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span className="font-bold text-slate-900 block mb-1">Backend &amp; ML Stack</span>
              <ul className="space-y-1 text-slate-600">
                <li>&bull; Python 3.11+ &amp; FastAPI</li>
                <li>&bull; Pandas &amp; NumPy</li>
                <li>&bull; Scikit-learn RandomForest</li>
                <li>&bull; Pydantic &amp; Pytest</li>
              </ul>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              <span>Synthetic Academic Data &amp; Ethical Use Disclaimer</span>
            </div>
            <p className="leading-relaxed">
              All 1,000 employee records are synthetically generated using a documented mathematical
              scoring rule for academic demonstration. Model evaluation metrics reflect performance
              on synthetic data and do not represent real-world workplace prediction accuracy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
