'use client';

import { useState, useEffect } from 'react';
import { reportsApi } from '@/lib/api';

interface Case {
  id: string;
  emailId: string;
  classification: string;
  priority: string;
  supplierName: string | null;
  locationName: string | null;
  caseDueAt: string | null;
  completedAt: string | null;
  isOnTime: boolean | null;
  isInFull: boolean | null;
  isOtif: boolean | null;
  approvalLeadMinutes: number | null;
  executionLeadMinutes: number | null;
  totalTasks: number;
  completedTasks: number;
  partialTasks: number;
  failedTasks: number;
  email: {
    subject: string;
    sender: string;
  };
}

export default function CasesPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cases, setCases] = useState<Case[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0],
  });
  const [filters, setFilters] = useState({
    otif: '' as '' | 'true' | 'false',
    supplierName: '',
    locationName: '',
  });

  useEffect(() => {
    loadCases();
  }, [page, dateRange, filters]);

  async function loadCases() {
    setLoading(true);
    setError(null);
    try {
      const data = await reportsApi.getCases({
        from: dateRange.from,
        to: dateRange.to,
        otif: filters.otif === 'true' ? true : filters.otif === 'false' ? false : undefined,
        supplierName: filters.supplierName || undefined,
        locationName: filters.locationName || undefined,
        page,
        pageSize: 20,
      });
      setCases(data.cases);
      setTotal(data.total);
    } catch (err) {
      console.error('Failed to load cases:', err);
      setError('Failed to load cases. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function formatDate(date: string | null): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString();
  }

  function formatMinutes(minutes: number | null): string {
    if (minutes === null) return '-';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }

  const totalPages = Math.ceil(total / 20);

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-red-800 text-lg font-semibold mb-2">Error</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadCases}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Case Drilldown</h1>
        <div className="flex gap-2">
          <input
            type="date"
            value={dateRange.from}
            onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
            className="px-3 py-2 border rounded"
          />
          <span className="self-center">to</span>
          <input
            type="date"
            value={dateRange.to}
            onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
            className="px-3 py-2 border rounded"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <select
          value={filters.otif}
          onChange={(e) => setFilters({ ...filters, otif: e.target.value as any })}
          className="px-3 py-2 border rounded"
        >
          <option value="">All Cases</option>
          <option value="true">OTIF Only</option>
          <option value="false">Non-OTIF</option>
        </select>
        <input
          type="text"
          placeholder="Filter by supplier..."
          value={filters.supplierName}
          onChange={(e) => setFilters({ ...filters, supplierName: e.target.value })}
          className="px-3 py-2 border rounded"
        />
        <input
          type="text"
          placeholder="Filter by location..."
          value={filters.locationName}
          onChange={(e) => setFilters({ ...filters, locationName: e.target.value })}
          className="px-3 py-2 border rounded"
        />
        <button
          onClick={() => setFilters({ otif: '', supplierName: '', locationName: '' })}
          className="px-3 py-2 text-gray-600 hover:text-gray-800"
        >
          Reset Filters
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Email Subject</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Supplier</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Location</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Due Date</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Completed</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">OTIF</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">On-Time</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">In-Full</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Approval</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Execution</th>
            </tr>
          </thead>
          <tbody>
            {cases.map((c) => (
              <tr key={c.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="font-medium truncate max-w-xs">{c.email.subject}</div>
                  <div className="text-xs text-gray-400">{c.classification}</div>
                </td>
                <td className="px-4 py-3">{c.supplierName || '-'}</td>
                <td className="px-4 py-3">{c.locationName || '-'}</td>
                <td className="px-4 py-3 text-right">{formatDate(c.caseDueAt)}</td>
                <td className="px-4 py-3 text-right">{formatDate(c.completedAt)}</td>
                <td className="px-4 py-3 text-center">
                  {c.isOtif === true && <span className="text-green-600 font-bold">✓</span>}
                  {c.isOtif === false && <span className="text-red-600">✗</span>}
                  {c.isOtif === null && <span className="text-gray-400">-</span>}
                </td>
                <td className="px-4 py-3 text-center">
                  {c.isOnTime === true && <span className="text-green-600">✓</span>}
                  {c.isOnTime === false && <span className="text-red-600">✗</span>}
                  {c.isOnTime === null && <span className="text-gray-400">-</span>}
                </td>
                <td className="px-4 py-3 text-center">
                  {c.isInFull === true && <span className="text-green-600">✓</span>}
                  {c.isInFull === false && <span className="text-red-600">✗</span>}
                  {c.isInFull === null && <span className="text-gray-400">-</span>}
                </td>
                <td className="px-4 py-3 text-right">{formatMinutes(c.approvalLeadMinutes)}</td>
                <td className="px-4 py-3 text-right">{formatMinutes(c.executionLeadMinutes)}</td>
              </tr>
            ))}
            {cases.length === 0 && (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-gray-400">
                  No cases found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-4 py-2 border rounded disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-4 py-2">
            Page {page} of {totalPages} ({total} total)
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}