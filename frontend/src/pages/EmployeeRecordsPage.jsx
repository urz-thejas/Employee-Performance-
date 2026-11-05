import React, { useState, useEffect } from 'react';
import {
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Filter,
} from 'lucide-react';
import { fetchEmployees, getProcessedCsvDownloadUrl } from '../services/api';
import StatusBadge from '../components/StatusBadge';

const DEPARTMENTS = ['All', 'IT', 'HR', 'Finance', 'Marketing', 'Sales', 'Operations'];
const CATEGORIES = ['All', 'High', 'Medium', 'Needs Support'];

export default function EmployeeRecordsPage({ refreshTrigger }) {
  const [records, setRecords] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    page_size: 15,
    total_records: 0,
    total_pages: 1,
  });
  const [department, setDepartment] = useState('All');
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState('Employee_ID');
  const [sortDir, setSortDir] = useState('asc');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPagination((prev) => ({ ...prev, page: 1 }));
    }, 250);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    fetchEmployees({
      page: pagination.page,
      pageSize: pagination.page_size,
      department,
      category,
      search: debouncedSearch,
      sortBy,
      sortDir,
    })
      .then((res) => {
        if (active) {
          setRecords(res.records || []);
          setPagination(res.pagination);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (active) {
          setError(err?.response?.data?.detail || err.message || 'Error loading employees');
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [
    pagination.page,
    pagination.page_size,
    department,
    category,
    debouncedSearch,
    sortBy,
    sortDir,
    refreshTrigger,
  ]);

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(column);
      setSortDir('desc');
    }
  };

  const exportCurrentPageCsv = () => {
    if (!records.length) return;
    const headers = [
      'Employee_ID',
      'Employee_Name',
      'Department',
      'Experience_Years',
      'Attendance_Rate',
      'Task_Completion_Rate',
      'Productivity_Score',
      'Quality_Score',
      'Training_Hours',
      'Projects_Completed',
      'Deadline_Completion_Rate',
      'Customer_Feedback_Score',
      'Performance_Category',
    ];
    const rows = records.map((r) => headers.map((h) => JSON.stringify(r[h] ?? '')).join(','));
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `employees_filtered_page_${pagination.page}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      {/* Search & Filters */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by Employee ID or Name..."
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400 hidden sm:inline" />
              <select
                value={department}
                onChange={(e) => {
                  setDepartment(e.target.value);
                  setPagination((p) => ({ ...p, page: 1 }));
                }}
                className="px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-700"
              >
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d === 'All' ? 'All Departments' : d}
                  </option>
                ))}
              </select>

              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setPagination((p) => ({ ...p, page: 1 }));
                }}
                className="px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-700"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c === 'All' ? 'All Categories' : c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={exportCurrentPageCsv}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Export Filtered View
            </button>
            <a
              href={getProcessedCsvDownloadUrl()}
              download="processed_employee_analytics.csv"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Export Full Dataset ({pagination.total_records})
            </a>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm">
          {String(error)}
        </div>
      )}

      {/* Employee Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                {[
                  { key: 'Employee_ID', label: 'Employee ID', align: 'left' },
                  { key: 'Employee_Name', label: 'Employee Name', align: 'left' },
                  { key: 'Department', label: 'Department', align: 'left' },
                  { key: 'Experience_Years', label: 'Exp (Yrs)', align: 'right' },
                  { key: 'Attendance_Rate', label: 'Attendance', align: 'right' },
                  { key: 'Productivity_Score', label: 'Productivity', align: 'right' },
                  { key: 'Quality_Score', label: 'Quality Score', align: 'right' },
                  { key: 'Performance_Category', label: 'Performance Category', align: 'left' },
                ].map((col) => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className={`py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition-colors select-none ${
                      col.align === 'right' ? 'text-right' : 'text-left'
                    }`}
                  >
                    <div
                      className={`inline-flex items-center gap-1 ${
                        col.align === 'right' ? 'justify-end' : ''
                      }`}
                    >
                      <span>{col.label}</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    Loading employee records from FastAPI backend...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    No employee records match your current filter criteria.
                  </td>
                </tr>
              ) : (
                records.map((emp) => (
                  <tr key={emp.Employee_ID} className="hover:bg-slate-50/90 transition-colors">
                    <td className="py-3 px-4 font-mono text-xs font-semibold text-blue-600">
                      {emp.Employee_ID}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900">{emp.Employee_Name}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-medium">
                        {emp.Department}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-slate-600">{emp.Experience_Years}</td>
                    <td className="py-3 px-4 text-right font-medium text-slate-800">
                      {emp.Attendance_Rate}%
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-blue-700">
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

        {/* Pagination Footer */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-slate-600">
          <div>
            Showing page <span className="font-semibold text-slate-900">{pagination.page}</span> of{' '}
            <span className="font-semibold text-slate-900">{pagination.total_pages}</span> (
            <span className="font-semibold text-slate-900">
              {pagination.total_records.toLocaleString()}
            </span>{' '}
            matching employees)
          </div>

          <div className="flex items-center gap-2">
            <select
              value={pagination.page_size}
              onChange={(e) =>
                setPagination((p) => ({ ...p, page_size: Number(e.target.value), page: 1 }))
              }
              className="px-2 py-1 rounded border border-slate-300 bg-white text-xs"
            >
              <option value={10}>10 / page</option>
              <option value={15}>15 / page</option>
              <option value={25}>25 / page</option>
              <option value={50}>50 / page</option>
            </select>

            <button
              type="button"
              disabled={pagination.page <= 1}
              onClick={() => setPagination((p) => ({ ...p, page: Math.max(1, p.page - 1) }))}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none font-medium"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Prev
            </button>

            <button
              type="button"
              disabled={pagination.page >= pagination.total_pages}
              onClick={() =>
                setPagination((p) => ({ ...p, page: Math.min(p.total_pages, p.page + 1) }))
              }
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none font-medium"
            >
              Next
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
