'use client';

import { useState, useEffect } from 'react';
import { reportsApi } from '@/lib/api';

interface Coordinator {
  coordinatorUserId: string;
  coordinatorName: string;
  roleCode: string;
  assignedTasks: number;
  completedTasks: number;
  partialTasks: number;
  failedTasks: number;
  otifCases: number;
  totalCases: number;
  otifRate: number;
  avgCompletionTime: number | null;
}

export default function CoordinatorsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [coordinators, setCoordinators] = useState<Coordinator[]>([]);
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0],
  });
  const [roleFilter, setRoleFilter] = useState('');

  useEffect(() => {
    loadCoordinators();
  }, [dateRange, roleFilter]);

  async function loadCoordinators() {
    setLoading(true);
    setError(null);
    try {
      const data = await reportsApi.getCoordinators({
        from: dateRange.from,
        to: dateRange.to,
        roleCode: roleFilter || undefined,
      });
      setCoordinators(data);
    } catch (err) {
      console.error('Failed to load coordinators:', err);
      setError('Failed to load coordinators. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function formatMinutes(minutes: number | null): string {
    if (minutes === null) return '-';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }

  function exportToCSV(data: any[], filename: string) {
    if (!data || data.length === 0) return;
    
    // Get headers from first object
    const headers = Object.keys(data[0]);
    
    // Build CSV content
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => {
        const value = row[header];
        // Handle string values that might contain commas
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value}"`;
        }
        return value;
      }).join(','))
    ].join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

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
            onClick={loadCoordinators}
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
        <h1 className="text-2xl font-bold">Coordinator Performance</h1>
        <div className="flex gap-4 items-center">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 border rounded"
          >
            <option value="">All Roles</option>
            <option value="RECEPTION_COORDINATOR">Reception Coordinator</option>
            <option value="DELIVERY_COORDINATOR">Delivery Coordinator</option>
            <option value="DISTRIBUTION_COORDINATOR">Distribution Coordinator</option>
          </select>
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
          <button
            onClick={() => { setRoleFilter(''); setDateRange({ from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], to: new Date().toISOString().split('T')[0] }); }}
            className="px-3 py-2 text-gray-600 hover:text-gray-800"
          >
            Reset
          </button>
          <button
            onClick={() => exportToCSV(coordinators, 'coordinators-report')}
            className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Export CSV
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full" id="coordinators-table">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Coordinator</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Role</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Assigned</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Completed</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Partial</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Failed</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">OTIF %</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Avg Time</th>
            </tr>
          </thead>
          <tbody>
            {coordinators.map((c) => (
              <tr key={c.coordinatorUserId} className="border-t hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{c.coordinatorName}</td>
                <td className="px-4 py-3 text-gray-500">{c.roleCode.replace('_', ' ')}</td>
                <td className="px-4 py-3 text-right">{c.assignedTasks}</td>
                <td className="px-4 py-3 text-right text-green-600">{c.completedTasks}</td>
                <td className="px-4 py-3 text-right text-yellow-600">{c.partialTasks}</td>
                <td className="px-4 py-3 text-right text-red-600">{c.failedTasks}</td>
                <td className="px-4 py-3 text-right font-bold text-green-600">{c.otifRate.toFixed(1)}%</td>
                <td className="px-4 py-3 text-right">{formatMinutes(c.avgCompletionTime)}</td>
              </tr>
            ))}
            {coordinators.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                  No coordinator data available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}