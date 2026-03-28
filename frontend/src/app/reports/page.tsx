'use client';

import { useState, useEffect } from 'react';
import { reportsApi } from '@/lib/api';

interface OverviewMetrics {
  totalCases: number;
  otifCases: number;
  onTimeCases: number;
  inFullCases: number;
  overdueCases: number;
  avgApprovalMinutes: number | null;
  avgExecutionMinutes: number | null;
  otifRate: number;
  onTimeRate: number;
  inFullRate: number;
  overdueRate: number;
}

interface OtifTrend {
  period: string;
  totalCases: number;
  otifCases: number;
  onTimeCases: number;
  inFullCases: number;
  otifRate: number;
  onTimeRate: number;
  inFullRate: number;
}

interface DelayReason {
  groupKey: string;
  delayCount: number;
  partialCount: number;
  failedCount: number;
  share: number;
  avgDelayMinutes: number | null;
}

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<OverviewMetrics | null>(null);
  const [trend, setTrend] = useState<OtifTrend[]>([]);
  const [delays, setDelays] = useState<DelayReason[]>([]);
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    loadReports();
  }, [dateRange]);

  async function loadReports() {
    setLoading(true);
    try {
      const [metricsData, trendData, delaysData] = await Promise.all([
        reportsApi.getOverview({ from: dateRange.from, to: dateRange.to }),
        reportsApi.getOtifTrend({ from: dateRange.from, to: dateRange.to, groupBy: 'day' }),
        reportsApi.getDelayReasons({ from: dateRange.from, to: dateRange.to, groupBy: 'reason' }),
      ]);
      setMetrics(metricsData);
      setTrend(trendData);
      setDelays(delaysData);
    } catch (error) {
      console.error('Failed to load reports:', error);
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

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Reports & OTIF Dashboard</h1>
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

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
          <div className="text-sm text-gray-500">Total Cases</div>
          <div className="text-2xl font-bold">{metrics?.totalCases || 0}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
          <div className="text-sm text-gray-500">OTIF Rate</div>
          <div className="text-2xl font-bold">{(metrics?.otifRate || 0).toFixed(1)}%</div>
          <div className="text-xs text-gray-400">{metrics?.otifCases || 0} of {metrics?.totalCases || 0} cases</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-purple-500">
          <div className="text-sm text-gray-500">On-Time Rate</div>
          <div className="text-2xl font-bold">{(metrics?.onTimeRate || 0).toFixed(1)}%</div>
          <div className="text-xs text-gray-400">{metrics?.onTimeCases || 0} of {metrics?.totalCases || 0} cases</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-yellow-500">
          <div className="text-sm text-gray-500">In-Full Rate</div>
          <div className="text-2xl font-bold">{(metrics?.inFullRate || 0).toFixed(1)}%</div>
          <div className="text-xs text-gray-400">{metrics?.inFullCases || 0} of {metrics?.totalCases || 0} cases</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8 mb-8">
        {/* Average Times */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Average Lead Times</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded">
              <div className="text-sm text-gray-500">Avg Approval Time</div>
              <div className="text-xl font-bold">{formatMinutes(metrics?.avgApprovalMinutes ?? null)}</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded">
              <div className="text-sm text-gray-500">Avg Execution Time</div>
              <div className="text-xl font-bold">{formatMinutes(metrics?.avgExecutionMinutes ?? null)}</div>
            </div>
          </div>
        </div>

        {/* Overdue */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Overdue Analysis</h2>
          <div className="text-center p-4 bg-red-50 rounded">
            <div className="text-sm text-gray-500">Overdue Cases</div>
            <div className="text-2xl font-bold text-red-600">{metrics?.overdueCases || 0}</div>
            <div className="text-sm text-gray-400">({metrics?.overdueRate?.toFixed(1) || 0}% of total)</div>
          </div>
        </div>
      </div>

      {/* OTIF Trend Chart */}
      <div className="bg-white p-4 rounded-lg shadow mb-8">
        <h2 className="text-lg font-semibold mb-4">OTIF Trend</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Period</th>
                <th className="text-right">Total Cases</th>
                <th className="text-right">OTIF</th>
                <th className="text-right">On-Time</th>
                <th className="text-right">In-Full</th>
              </tr>
            </thead>
            <tbody>
              {trend.slice(-14).map((t) => (
                <tr key={t.period} className="border-b">
                  <td className="py-2">{t.period}</td>
                  <td className="text-right">{t.totalCases}</td>
                  <td className="text-right font-medium text-green-600">{t.otifRate.toFixed(1)}%</td>
                  <td className="text-right">{t.onTimeRate.toFixed(1)}%</td>
                  <td className="text-right">{t.inFullRate.toFixed(1)}%</td>
                </tr>
              ))}
              {trend.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-4 text-gray-400">No data available</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delay Reasons */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Top Delay Reasons</h2>
        <div className="space-y-2">
          {delays.slice(0, 5).map((d) => (
            <div key={d.groupKey} className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <div>
                <div className="font-medium">{d.groupKey}</div>
                <div className="text-xs text-gray-500">
                  {d.partialCount} partial, {d.failedCount} failed
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold">{d.delayCount} delays</div>
                <div className="text-xs text-gray-400">{d.share.toFixed(1)}% share</div>
              </div>
            </div>
          ))}
          {delays.length === 0 && (
            <div className="text-center py-4 text-gray-400">No delays recorded</div>
          )}
        </div>
      </div>
    </div>
  );
}