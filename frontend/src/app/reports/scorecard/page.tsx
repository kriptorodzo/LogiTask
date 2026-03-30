'use client';

import { useState, useEffect } from 'react';
import { reportsApi } from '@/lib/api';
import PageShell from '@/components/PageShell';

interface Scorecard {
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

export default function ScorecardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scorecard, setScorecard] = useState<Scorecard | null>(null);
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    loadScorecard();
  }, [dateRange]);

  async function loadScorecard() {
    setLoading(true);
    setError(null);
    try {
      const data = await reportsApi.getMyScorecard({
        from: dateRange.from,
        to: dateRange.to,
      });
      // API returns array, get first (or only) item
      if (Array.isArray(data) && data.length > 0) {
        setScorecard(data[0] as Scorecard);
      } else {
        setScorecard(null);
      }
    } catch (err) {
      console.error('Failed to load scorecard:', err);
      setError('Failed to load your scorecard. Please try again.');
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

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
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
            onClick={loadScorecard}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <PageShell title="My Performance" subtitle="Personal scorecard" showBack backHref="/reports">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div></div>
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
          <button
            onClick={() => setDateRange({ from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], to: new Date().toISOString().split('T')[0] })}
            className="px-3 py-2 text-gray-600 hover:text-gray-800"
          >
            Reset
          </button>
        </div>
      </div>

      {!scorecard ? (
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <p className="text-gray-500">No performance data available for the selected period.</p>
          <p className="text-gray-400 mt-2">Complete tasks to see your scorecard here.</p>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
              <div className="text-sm text-gray-500">Assigned Tasks</div>
              <div className="text-2xl font-bold">{scorecard.assignedTasks}</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
              <div className="text-sm text-gray-500">OTIF Rate</div>
              <div className="text-2xl font-bold">{scorecard.otifRate.toFixed(1)}%</div>
              <div className="text-xs text-gray-400">{scorecard.otifCases} of {scorecard.totalCases} cases</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow border-l-4 border-purple-500">
              <div className="text-sm text-gray-500">Completed</div>
              <div className="text-2xl font-bold text-green-600">{scorecard.completedTasks}</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow border-l-4 border-yellow-500">
              <div className="text-sm text-gray-500">Avg Completion Time</div>
              <div className="text-2xl font-bold">{formatMinutes(scorecard.avgCompletionTime)}</div>
            </div>
          </div>

          {/* Task Breakdown */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-white p-4 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-4">Task Results</h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Completed (Full)</span>
                  <span className="font-bold text-green-600">{scorecard.completedTasks}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Partial</span>
                  <span className="font-bold text-yellow-600">{scorecard.partialTasks}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Failed</span>
                  <span className="font-bold text-red-600">{scorecard.failedTasks}</span>
                </div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-4">Role</h2>
              <div className="text-center py-4">
                <div className="text-2xl font-bold">{scorecard.roleCode.replace('_', ' ')}</div>
                <div className="text-gray-500">Your role</div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-4">Case Summary</h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Cases</span>
                  <span className="font-bold">{scorecard.totalCases}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">OTIF Cases</span>
                  <span className="font-bold text-green-600">{scorecard.otifCases}</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
    </PageShell>
  );
}