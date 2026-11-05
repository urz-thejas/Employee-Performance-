import React from 'react';

export default function StatusBadge({ category }) {
  const styles = {
    High: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-500/20',
    Medium: 'bg-blue-50 text-blue-700 border-blue-200 ring-blue-500/20',
    'Needs Support': 'bg-amber-50 text-amber-700 border-amber-200 ring-amber-500/20',
  };

  const dotStyles = {
    High: 'bg-emerald-500',
    Medium: 'bg-blue-500',
    'Needs Support': 'bg-amber-500',
  };

  const badgeClass = styles[category] || 'bg-slate-100 text-slate-700 border-slate-200';
  const dotClass = dotStyles[category] || 'bg-slate-400';

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badgeClass}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
      {category}
    </span>
  );
}
