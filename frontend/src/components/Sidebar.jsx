import React from 'react';
import {
  LayoutDashboard,
  Users,
  BarChart3,
  BrainCircuit,
  ShieldCheck,
  Info,
  Sparkles,
  X,
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, badge: null },
  { id: 'employees', label: 'Employee Records', icon: Users, badge: '1,000' },
  { id: 'analytics', label: 'Performance Analytics', icon: BarChart3, badge: 'Pandas' },
  { id: 'prediction', label: 'ML Prediction', icon: BrainCircuit, badge: 'RF' },
  { id: 'evaluation', label: 'Model Evaluation', icon: ShieldCheck, badge: null },
  { id: 'about', label: 'About Project', icon: Info, badge: null },
];

export default function Sidebar({ activeTab, setActiveTab, mobileOpen, setMobileOpen, totalRecords }) {
  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-950/60 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#0b1325] text-slate-200 flex flex-col border-r border-slate-800/80 transition-transform duration-200 lg:static lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-5 py-5 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-md shadow-cyan-500/20">
              <Sparkles className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-white leading-tight">
                Employee Performance
              </h1>
              <span className="text-[11px] font-medium text-cyan-400 tracking-wide uppercase">
                Analytics System
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-4 pt-5 pb-2">
          <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Analytics Workspace
          </p>
        </div>

        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const badgeText = item.id === 'employees' && totalRecords ? totalRecords.toLocaleString() : item.badge;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600/90 to-cyan-500/80 text-white shadow-sm shadow-blue-500/20'
                    : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-cyan-400/80'}`} />
                  <span>{item.label}</span>
                </div>
                {badgeText && (
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-800 text-cyan-300 border border-slate-700'
                    }`}
                  >
                    {badgeText}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-4 m-3 rounded-xl bg-slate-900/90 border border-slate-800/90">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-xs font-semibold text-white">ML Engine Active</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Scikit-learn <span className="text-cyan-300 font-medium">RandomForest</span> (100 trees, stratified 80/20 split).
          </p>
          <div className="mt-2.5 pt-2.5 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span>Dataset Nature</span>
            <span className="text-amber-300 font-medium">Synthetic Academic</span>
          </div>
        </div>
      </aside>
    </>
  );
}
