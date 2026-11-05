import React from 'react';
import {
  Menu,
  Download,
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { getRawCsvDownloadUrl, getProcessedCsvDownloadUrl } from '../services/api';

export default function Header({
  activeTab,
  setMobileOpen,
  backendStatus,
  onRefresh,
  onUploadClick,
}) {
  const titles = {
    overview: {
      title: 'Executive HR Performance Overview',
      subtitle: 'Real-time KPI metrics, departmental distributions, and productivity analytics',
    },
    employees: {
      title: 'Employee Directory & Performance Records',
      subtitle: 'Searchable, filterable employee dataset with CSV upload and export',
    },
    analytics: {
      title: 'Pandas Data Preprocessing & Feature Engineering',
      subtitle: 'Data cleaning pipeline telemetry and derived performance indicators',
    },
    prediction: {
      title: 'Individual Employee ML Performance Predictor',
      subtitle: 'Interactive Random Forest classification with probability & feature importance analysis',
    },
    evaluation: {
      title: 'Scikit-learn Model Evaluation & Validation',
      subtitle: 'Stratified 80/20 test split metrics, confusion matrix, and classification report',
    },
    about: {
      title: 'About Project & System Architecture',
      subtitle: 'Methodology, formulas, deployment architecture, and academic disclosures',
    },
  };

  const current = titles[activeTab] || titles.overview;

  return (
    <header className="bg-white border-b border-slate-200/90 px-4 sm:px-6 py-3.5 sticky top-0 z-20">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              {current.title}
            </h2>
            <p className="text-xs text-slate-500 hidden sm:block">{current.subtitle}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Backend Connection Indicator */}
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${
              backendStatus.connected
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}
            title={
              backendStatus.connected
                ? `Connected to FastAPI Backend (${backendStatus.records} records loaded)`
                : 'Backend unreachable'
            }
          >
            {backendStatus.connected ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>API Online ({backendStatus.records} rows)</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>API Disconnected</span>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
            title="Refresh backend data"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Refresh</span>
          </button>

          <button
            type="button"
            onClick={onUploadClick}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload CSV</span>
          </button>

          <a
            href={getRawCsvDownloadUrl()}
            download="sample_employee_dataset_raw.csv"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 shadow-2xs transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" />
            <span>Sample CSV</span>
          </a>

          <a
            href={getProcessedCsvDownloadUrl()}
            download="processed_employee_analytics.csv"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-xs transition-all"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Processed CSV</span>
          </a>
        </div>
      </div>
    </header>
  );
}
