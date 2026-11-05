import React, { useState, useEffect } from 'react';
import {
  Users,
  CalendarCheck,
  TrendingUp,
  Award,
  Sparkles,
  AlertCircle,
  Search,
  Filter,
  RotateCcw,
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
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  ZAxis,
} from 'recharts';
import { fetchDashboard } from '../services/api';
import StatusBadge from '../components/StatusBadge';

const CATEGORY_COLORS = {
  High: '#10b981',
  Medium: '#3b82f6',
  'Needs Support': '#f59e0b',
};

export default function OverviewPage({ refreshTrigger, onNavigateEmployees }) {
  const [department, setDepartment] = useState('All');
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 250);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    fetchDashboard({ department, category, search: debouncedSearch })
      .then((res) => {
        if (active) {
          setData(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (active) {
          setError(err?.response?.data?.detail || err.message || 'Failed to load dashboard data');
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [department, category, debouncedSearch, refreshTrigger]);

  const handleResetFilters = () => {
    setDepartment('All');
    setCategory('All');
    setSearch('');
  };

  if (error) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-rose-800">
        <h3 className="font-semibold text-base mb-1">Unable to Load Dashboard Data</h3>
        <p className="text-sm">{String(error)}</p>
      </div>
    );
  }

  const kpis = data?.kpis || {
    total_employees: 0,
    avg_attendance: 0,
    avg_productivity: 0,
    avg_quality_score: 0,
    high_performers: 0,
    needs_support: 0,
  };

  const kpiCards = [
    {
      label: 'Total Employees',
      value: kpis.total_employees.toLocaleString(),
      sub: 'Cleaned active cohort',
      icon: Users,
      accent: 'from-blue-600 to-cyan-500',
      iconBg: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'Average Attendance',
      value: `${kpis.avg_attendance}%`,
      sub: 'Present / Working days',
      icon: CalendarCheck,
      accent: 'from-cyan-500 to-teal-500',
      iconBg: 'bg-cyan-50 text-cyan-600',
    },
    {
      label: 'Average Productivity',
      value: `${kpis.avg_productivity}`,
      sub: '60% Tasks + 40% Quality',
      icon: TrendingUp,
      accent: 'from-indigo-600 to-blue-500',
      iconBg: 'bg-indigo-50 text-indigo-600',
    },
    {
      label: 'Average Quality Score',
      value: `${kpis.avg_quality_score}`,
      sub: 'Peer & manager audit (0-100)',
      icon: Award,
      accent: 'from-blue-500 to-indigo-500',
      iconBg: 'bg-sky-50 text-sky-600',
    },
    {
      label: 'High Performers',
      value: kpis.high_performers.toLocaleString(),
      sub: kpis.total_employees
        ? `${((kpis.high_performers / kpis.total_employees) * 100).toFixed(1)}% of filtered cohort`
        : '0% of cohort',
      icon: Sparkles,
      accent: 'from-emerald-500 to-teal-500',
      iconBg: 'bg-emerald-50 text-emerald-600',
    },
    {
      label: 'Employees Needing Support',
      value: kpis.needs_support.toLocaleString(),
      sub: kpis.total_employees
        ? `${((kpis.needs_support / kpis.total_employees) * 100).toFixed(1)}% prioritized for coaching`
        : '0% of cohort',
      icon: AlertCircle,
      accent: 'from-amber-500 to-orange-500',
      iconBg: 'bg-amber-50 text-amber-600',
    },
  ];

  const perfDist = data?.charts?.performance_distribution || [];
  const deptPerf = data?.charts?.department_performance || [];
  const scatterData = data?.charts?.attendance_vs_productivity || [];
  const prodComp = data?.charts?.employee_productivity_comparison || [];
  const recentEmployees = data?.recent_employees || [];
  const departments = data?.departments || ['IT', 'HR', 'Finance', 'Marketing', 'Sales', 'Operations'];

  return (
    <div className="space-y-6">
      {/* Interactive Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-slate-700 font-semibold text-sm">
            <Filter className="w-4 h-4 text-blue-600" />
            <span>Dynamic Cohort Filters</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 sm:flex-initial sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search ID or employee name..."
                className="w-full pl-9 pr-3 py-1.5 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              />
            </div>

            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            >
              <option value="All">All Departments</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            >
              <option value="All">All Categories</option>
              <option value="High">High Performers</option>
              <option value="Medium">Medium Performers</option>
              <option value="Needs Support">Needs Support</option>
            </select>

            {(department !== 'All' || category !== 'All' || search !== '') && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 6 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs hover:shadow-md transition-shadow relative overflow-hidden"
            >
              <div className={`h-1 w-full bg-gradient-to-r ${card.accent} absolute top-0 left-0`} />
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-medium text-slate-500">{card.label}</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">
                    {loading ? '...' : card.value}
                  </p>
                </div>
                <div className={`p-2 rounded-lg ${card.iconBg}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <p className="text-[11px] text-slate-400 mt-2.5">{card.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Row 1 Charts: Performance Category Distribution (Bar) + Performance Distribution (Pie) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs">
          <div className="mb-4">
            <h3 className="text-base font-bold text-slate-900">
              Performance Category Distribution
            </h3>
            <p className="text-xs text-slate-500">
              Employee headcount breakdown across synthetic performance tiers
            </p>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={perfDist} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="category" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value, name) => [value, name === 'count' ? 'Employees' : name]}
                  contentStyle={{ borderRadius: '8px', borderColor: '#cbd5e1' }}
                />
                <Bar dataKey="count" name="Employee Count" radius={[6, 6, 0, 0]}>
                  {perfDist.map((entry) => (
                    <Cell
                      key={entry.category}
                      fill={CATEGORY_COLORS[entry.category] || '#3b82f6'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs">
          <div className="mb-4">
            <h3 className="text-base font-bold text-slate-900">
              Performance Distribution Pie Chart
            </h3>
            <p className="text-xs text-slate-500">
              Proportional share of High, Medium, and Needs Support cohorts
            </p>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={perfDist}
                  dataKey="count"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={4}
                  label={({ category, percentage }) => `${category}: ${percentage}%`}
                >
                  {perfDist.map((entry) => (
                    <Cell
                      key={entry.category}
                      fill={CATEGORY_COLORS[entry.category] || '#3b82f6'}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 2 Charts: Department-wise Performance + Attendance vs Productivity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs">
          <div className="mb-4">
            <h3 className="text-base font-bold text-slate-900">Department-wise Performance</h3>
            <p className="text-xs text-slate-500">
              Average Productivity, Attendance Rate, and Quality Score across departments
            </p>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptPerf} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="department" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: '8px', borderColor: '#cbd5e1' }} />
                <Legend />
                <Bar dataKey="avg_productivity" name="Avg Productivity" fill="#2563eb" radius={[4, 4, 0, 0]} />
                <Bar dataKey="avg_attendance" name="Avg Attendance %" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                <Bar dataKey="avg_quality" name="Avg Quality" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs">
          <div className="mb-4">
            <h3 className="text-base font-bold text-slate-900">Attendance vs Productivity</h3>
            <p className="text-xs text-slate-500">
              Correlation between employee attendance rate (%) and engineered productivity score
            </p>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  type="number"
                  dataKey="Attendance_Rate"
                  name="Attendance Rate"
                  unit="%"
                  domain={[60, 100]}
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  type="number"
                  dataKey="Productivity_Score"
                  name="Productivity Score"
                  domain={[45, 100]}
                  tick={{ fontSize: 12 }}
                />
                <ZAxis type="number" dataKey="Quality_Score" range={[40, 120]} name="Quality Score" />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  contentStyle={{ borderRadius: '8px', borderColor: '#cbd5e1' }}
                />
                <Legend />
                <Scatter
                  name="High"
                  data={scatterData.filter((d) => d.Performance_Category === 'High')}
                  fill="#10b981"
                />
                <Scatter
                  name="Medium"
                  data={scatterData.filter((d) => d.Performance_Category === 'Medium')}
                  fill="#3b82f6"
                />
                <Scatter
                  name="Needs Support"
                  data={scatterData.filter((d) => d.Performance_Category === 'Needs Support')}
                  fill="#f59e0b"
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 3 Chart: Employee Productivity Comparison */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs">
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Employee Productivity Comparison (Top Cohort)
            </h3>
            <p className="text-xs text-slate-500">
              Comparing engineered Productivity Score, Task Completion Rate, and Quality Score across leading employees
            </p>
          </div>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={prodComp} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="Employee_Name" tick={{ fontSize: 11 }} interval={0} angle={-12} textAnchor="end" />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ borderRadius: '8px', borderColor: '#cbd5e1' }} />
              <Legend />
              <Bar dataKey="Productivity_Score" name="Productivity Score" fill="#0284c7" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Task_Completion_Rate" name="Task Completion %" fill="#22d3ee" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Quality_Score" name="Quality Score" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Employee Records Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Recent Employee Records</h3>
            <p className="text-xs text-slate-500">
              Showing {recentEmployees.length} records matching current dashboard filters
            </p>
          </div>
          <button
            type="button"
            onClick={onNavigateEmployees}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800"
          >
            View All Records &rarr;
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Employee ID</th>
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4 text-right">Attendance</th>
                <th className="py-3 px-4 text-right">Task Completion</th>
                <th className="py-3 px-4 text-right">Productivity</th>
                <th className="py-3 px-4 text-right">Quality Score</th>
                <th className="py-3 px-4">Category</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80 text-sm">
              {recentEmployees.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    No employee records match the selected filters.
                  </td>
                </tr>
              ) : (
                recentEmployees.map((emp) => (
                  <tr key={emp.Employee_ID} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono text-xs font-semibold text-blue-600">
                      {emp.Employee_ID}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900">{emp.Employee_Name}</td>
                    <td className="py-3 px-4 text-slate-600">{emp.Department}</td>
                    <td className="py-3 px-4 text-right font-medium text-slate-700">
                      {emp.Attendance_Rate}%
                    </td>
                    <td className="py-3 px-4 text-right text-slate-600">
                      {emp.Task_Completion_Rate}%
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-slate-900">
                      {emp.Productivity_Score}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-700">{emp.Quality_Score}</td>
                    <td className="py-3 px-4">
                      <StatusBadge category={emp.Performance_Category} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
