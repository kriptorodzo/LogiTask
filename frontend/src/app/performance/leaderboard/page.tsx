'use client';

import { useState, useEffect } from 'react';
import { performanceApi } from '@/lib/api';
import PageShell from '@/components/PageShell';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  userName: string;
  roleCode: string;
  otifRate: number;
  totalScore: number;
  completedTasks: number;
  assignedTasks: number;
}

const MONTHS = [
  'Јануари', 'Февруари', 'Март', 'Април', 'Мај', 'Јуни',
  'Јули', 'Август', 'Септември', 'Октомври', 'Ноември', 'Декември'
];

const ROLES = [
  { code: '', label: 'Сите улоги' },
  { code: 'RECEPTION_COORDINATOR', label: 'Прием' },
  { code: 'DELIVERY_COORDINATOR', label: 'Испорака' },
  { code: 'DISTRIBUTION_COORDINATOR', label: 'Дистрибуција' },
];

export default function LeaderboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedRole, setSelectedRole] = useState('');

  useEffect(() => {
    loadLeaderboard();
  }, [selectedMonth, selectedYear, selectedRole]);

  async function loadLeaderboard() {
    setLoading(true);
    setError(null);
    try {
      const data = await performanceApi.getLeaderboard({
        month: selectedMonth,
        year: selectedYear,
        role: selectedRole || undefined,
      });
      // Add rank to entries
      const ranked = (data as LeaderboardEntry[]).map((entry, index) => ({
        ...entry,
        rank: index + 1,
      }));
      setEntries(ranked);
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
      setError('Неуспешно вчитување на листата. Обидете се повторно.');
    } finally {
      setLoading(false);
    }
  }

  function getRankBadge(rank: number) {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  }

  function getRoleLabel(role: string): string {
    const labels: Record<string, string> = {
      RECEPTION_COORDINATOR: 'Прием',
      DELIVERY_COORDINATOR: 'Испорака',
      DISTRIBUTION_COORDINATOR: 'Дистрибуција',
    };
    return labels[role] || role;
  }

  function getScoreColor(score: number): string {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-blue-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
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
          <h2 className="text-red-800 text-lg font-semibold mb-2">Грешка</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadLeaderboard}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Обиди повторно
          </button>
        </div>
      </div>
    );
  }

  return (
    <PageShell title="Performance Leaderboard" subtitle="Monthly coordinator rankings by OTIF score">
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Листа на перформанси</h2>
          <div className="flex gap-2 items-center">
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="px-3 py-2 border rounded"
          >
            {ROLES.map((role) => (
              <option key={role.code} value={role.code}>{role.label}</option>
            ))}
          </select>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="px-3 py-2 border rounded"
          >
            {MONTHS.map((m, i) => (
              <option key={i} value={i + 1}>{m}</option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="px-3 py-2 border rounded"
          >
            <option value={2026}>2026</option>
            <option value={2025}>2025</option>
            <option value={2024}>2024</option>
          </select>
        </div>
      </div>

      {!entries || entries.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <p className="text-gray-500">Нема податоци за избраениот период.</p>
          <p className="text-gray-400 mt-2">Комплетирајте задачи за да се појавите на листата.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Ранг</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Координатор</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Улога</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-600">Задачи</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-600">OTIF</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-600">Скор</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {entries.map((entry) => (
                <tr key={entry.userId} className={entry.rank <= 3 ? 'bg-yellow-50' : ''}>
                  <td className="px-6 py-4">
                    <span className="text-2xl">{getRankBadge(entry.rank)}</span>
                  </td>
                  <td className="px-6 py-4 font-medium">{entry.userName}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-gray-100 rounded text-sm">
                      {getRoleLabel(entry.roleCode)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {entry.completedTasks} / {entry.assignedTasks}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`font-bold ${
                      entry.otifRate >= 90 ? 'text-green-600' :
                      entry.otifRate >= 75 ? 'text-blue-600' :
                      entry.otifRate >= 60 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {entry.otifRate.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`text-xl font-bold ${getScoreColor(entry.totalScore)}`}>
                      {entry.totalScore}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Legend */}
      <div className="mt-6 flex gap-6 text-sm text-gray-500">
        <div className="flex items-center gap-2">
          <span className="text-xl">🥇</span> <span>Прво место</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xl">🥈</span> <span>Второ место</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xl">🥉</span> <span>Трето место</span>
        </div>
      </div>
      </div>
    </PageShell>
  );
}