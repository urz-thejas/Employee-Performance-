import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import OverviewPage from './pages/OverviewPage';
import EmployeeRecordsPage from './pages/EmployeeRecordsPage';
import PerformanceAnalyticsPage from './pages/PerformanceAnalyticsPage';
import PredictionPage from './pages/PredictionPage';
import ModelEvaluationPage from './pages/ModelEvaluationPage';
import AboutProjectPage from './pages/AboutProjectPage';
import { fetchHealth, uploadDatasetCsv } from './services/api';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [backendStatus, setBackendStatus] = useState({
    connected: false,
    records: 1000,
    accuracy: 0,
  });
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [toast, setToast] = useState(null);
  const fileInputRef = useRef(null);

  const checkHealth = () => {
    fetchHealth()
      .then((res) => {
        setBackendStatus({
          connected: res.status === 'healthy',
          records: res.total_clean_records || 1000,
          accuracy: res.model_accuracy_pct || 0,
        });
      })
      .catch(() => {
        setBackendStatus((prev) => ({ ...prev, connected: false }));
      });
  };

  useEffect(() => {
    checkHealth();
  }, [refreshTrigger]);

  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
    setToast({
      type: 'success',
      message: 'Synchronized dashboard with FastAPI backend.',
    });
    setTimeout(() => setToast(null), 3000);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await uploadDatasetCsv(file);
      setRefreshTrigger((prev) => prev + 1);
      setToast({
        type: 'success',
        message: `${res.message} (${res.total_records} clean records, ${res.model_accuracy_pct}% accuracy)`,
      });
    } catch (err) {
      const detail = err?.response?.data?.detail;
      const msg =
        typeof detail === 'object'
          ? `${detail.message} Missing: ${(detail.missing_columns || []).join(', ')}`
          : detail || err.message || 'CSV upload failed';
      setToast({ type: 'error', message: msg });
    } finally {
      e.target.value = '';
      setTimeout(() => setToast(null), 5000);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        totalRecords={backendStatus.records}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Header
          activeTab={activeTab}
          setMobileOpen={setMobileOpen}
          backendStatus={backendStatus}
          onRefresh={handleRefresh}
          onUploadClick={() => fileInputRef.current?.click()}
        />

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          className="hidden"
        />

        {toast && (
          <div className="px-4 sm:px-6 pt-4">
            <div
              className={`flex items-center justify-between px-4 py-3 rounded-xl border text-xs font-medium shadow-xs ${
                toast.type === 'error'
                  ? 'bg-rose-50 text-rose-800 border-rose-200'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
              }`}
            >
              <div className="flex items-center gap-2">
                {toast.type === 'error' ? (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                )}
                <span>{toast.message}</span>
              </div>
              <button
                type="button"
                onClick={() => setToast(null)}
                className="p-1 rounded hover:bg-black/5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        <main className="flex-1 p-4 sm:p-6 max-w-[1600px] w-full mx-auto">
          {activeTab === 'overview' && (
            <OverviewPage
              refreshTrigger={refreshTrigger}
              onNavigateEmployees={() => setActiveTab('employees')}
            />
          )}
          {activeTab === 'employees' && <EmployeeRecordsPage refreshTrigger={refreshTrigger} />}
          {activeTab === 'analytics' && (
            <PerformanceAnalyticsPage refreshTrigger={refreshTrigger} />
          )}
          {activeTab === 'prediction' && <PredictionPage />}
          {activeTab === 'evaluation' && <ModelEvaluationPage refreshTrigger={refreshTrigger} />}
          {activeTab === 'about' && <AboutProjectPage />}
        </main>
      </div>
    </div>
  );
}
