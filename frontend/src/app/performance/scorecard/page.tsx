'use client';

import { useState, useEffect } from 'react';
import { performanceApi } from '@/lib/api';
import { useSession } from 'next-auth/react';
import TopBar from '@/components/TopBar';
import { KpiCard } from '@/components';

interface ScorecardData {
  userId: string;
  userName: string;
  roleCode: string;
  month: number;
  year: number;
  // Task metrics
  assignedTasks: number;
  completedTasks: number;
  partialTasks: number;
  failedTasks: number;
  // OTIF
  otifCases: number;
  totalCases: number;
  otifRate: number;
  // Timing
  avgCompletionTime: number | null;
  onTimeRate: number;
  // Manual KPIs
  tidiness?: number;
  discipline?: number;
  organization?: number;
  fuel?: number;
  incidents?: number;
  returns48h?: number;
  // Calculated
  totalScore: number;
  bonusEligible: boolean;
}

const MONTHS = [
  'Јануари', 'Февруари', 'Март', 'Април', 'Мај', 'Јуни',
  'Јули', 'Август', 'Септември', 'Октомври', 'Ноември', 'Декември'
];

export default function PerformanceScorecardPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scorecard, setScorecard] = useState<ScorecardData | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    loadScorecard();
  }, [selectedMonth, selectedYear]);

  async function loadScorecard() {
    setLoading(true);
    setError(null);
    try {
      // Use current user ID from session, or default to first coordinator for demo
      const userId = (session?.user as any)?.id || 'user-1';
      const data = await performanceApi.getScorecard(userId, {
        month: selectedMonth,
        year: selectedYear,
      });
      setScorecard(data as ScorecardData);
    } catch (err) {
      console.error('Failed to load scorecard:', err);
      setError('Неуспешно вчитување на перформансите. Обидете се повторно.');
    } finally {
      setLoading(false);
    }
  }

  function getBonusBadge(eligible: boolean, score: number) {
    if (!eligible) {
      return <span className="px-2 py-1 bg-gray-200 text-gray-600 rounded text-sm">Нема право</span>;
    }
    if (score >= 90) {
      return <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-sm">🏆 Gold</span>;
    }
    if (score >= 75) {
      return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">🥈 Silver</span>;
    }
    if (score >= 60) {
      return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-sm">🥉 Bronze</span>;
    }
    return <span className="px-2 py-1 bg-gray-200 text-gray-600 rounded text-sm">Нема право</span>;
  }

  function getScoreColor(score: number): string {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-blue-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  }

  function formatTime(minutes: number | null): string {
    if (minutes === null) return '-';
    if (minutes < 60) return `${minutes}мин`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}ч ${mins}м` : `${hours}ч`;
  }

  function getRoleLabel(role: string): string {
    const labels: Record<string, string> = {
      RECEPTION_COORDINATOR: 'Прием',
      DELIVERY_COORDINATOR: 'Испорака',
      DISTRIBUTION_COORDINATOR: 'Дистрибуција',
    };
    return labels[role] || role;
  }

  if (loading) {
    return (
      <>
        <TopBar 
          title="Performance Scorecard"
          subtitle="Loading..."
          breadcrumbs={[
            { label: 'Performance', href: '/performance/leaderboard' },
            { label: 'Scorecard' }
          ]}
        />
        <div className="page-content">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="grid grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <TopBar 
          title="Performance Scorecard"
          subtitle="Error"
          breadcrumbs={[
            { label: 'Performance', href: '/performance/leaderboard' },
            { label: 'Scorecard' }
          ]}
        />
        <div className="page-content">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h2 className="text-red-800 text-lg font-semibold mb-2">Грешка</h2>
            <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadScorecard}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Обиди повторно
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <TopBar 
        title="Performance Scorecard"
        subtitle={`${MONTHS[selectedMonth - 1]} ${selectedYear}`}
        breadcrumbs={[
          { label: 'Performance', href: '/performance/leaderboard' },
          { label: 'Scorecard' }
        ]}
      />
      <div className="page-content">
        {/* Main Score Card */}
        <div className="scorecard-hero">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold mb-1">{scorecard?.userName}</h2>
              <p className="text-blue-100">{scorecard && getRoleLabel(scorecard.roleCode)}</p>
              <p className="text-blue-100 text-sm">{scorecard && `${MONTHS[scorecard.month - 1]} ${scorecard.year}`}</p>
            </div>
            <div className="text-right">
              <div className="text-5xl font-bold mb-2">{scorecard?.totalScore}</div>
              <div className="text-blue-100">Вкупен скор</div>
              <div className="mt-2">{scorecard && getBonusBadge(scorecard.bonusEligible, scorecard.totalScore)}</div>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="kpi-grid">
          <KpiCard 
            label="Assigned Tasks" 
            value={scorecard?.assignedTasks || 0} 
            color="blue"
          />
          <KpiCard 
            label="Completed" 
            value={scorecard?.completedTasks || 0} 
            color="green"
          />
          <KpiCard 
            label="OTIF Rate" 
            value={`${(scorecard?.otifRate || 0).toFixed(1)}%`}
            subtext={`${scorecard?.otifCases || 0} of ${scorecard?.totalCases || 0} cases`}
            trend={scorecard && scorecard.otifRate >= 90 ? 'up' : scorecard && scorecard.otifRate >= 70 ? 'neutral' : 'down'}
            color="purple"
          />
          <KpiCard 
            label="On-Time Rate" 
            value={`${(scorecard?.onTimeRate || 0).toFixed(1)}%`}
            trend={scorecard && scorecard.onTimeRate >= 90 ? 'up' : 'down'}
            color="honey"
          />
        </div>
            <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
              <div className="text-sm text-gray-500">OTIF Ставка</div>
              <div className="text-2xl font-bold">{scorecard.otifRate.toFixed(1)}%</div>
              <div className="text-xs text-gray-400">{scorecard.otifCases} од {scorecard.totalCases}</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow border-l-4 border-purple-500">
              <div className="text-sm text-gray-500">Навреме</div>
              <div className="text-2xl font-bold text-green-600">{scorecard.onTimeRate.toFixed(1)}%</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow border-l-4 border-yellow-500">
              <div className="text-sm text-gray-500">Просечно време</div>
              <div className="text-2xl font-bold">{formatTime(scorecard.avgCompletionTime)}</div>
            </div>
          </div>

          {/* Task Breakdown */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Резултати на задачи</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Комплетирани</span>
                  <span className="font-bold text-green-600">{scorecard.completedTasks}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Деловно</span>
                  <span className="font-bold text-yellow-600">{scorecard.partialTasks}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Неуспешни</span>
                  <span className="font-bold text-red-600">{scorecard.failedTasks}</span>
                </div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Мануелни KPI</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Тиролина</span>
                  <span className="font-bold">{scorecard.tidiness ?? '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Дисциплина</span>
                  <span className="font-bold">{scorecard.discipline ?? '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Организацијa</span>
                  <span className="font-bold">{scorecard.organization ?? '-'}</span>
                </div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Бонус квалификации</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Гориво</span>
                  <span className="font-bold">{scorecard.fuel ?? '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Инциденти</span>
                  <span className="font-bold">{scorecard.incidents ?? '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Враќања 48ч</span>
                  <span className="font-bold">{scorecard.returns48h ?? '-'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Score Breakdown */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Разбивање на скор</h3>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <div className="text-sm text-gray-500 mb-1">OTIF (60%)</div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div 
                    className="bg-green-500 h-4 rounded-full" 
                    style={{ width: `${Math.min(scorecard.otifRate, 100)}%` }}
                  ></div>
                </div>
                <div className="text-right text-sm">{scorecard.otifRate.toFixed(1)}%</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">Мануелни KPI (40%)</div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div 
                    className="bg-blue-500 h-4 rounded-full" 
                    style={{ width: `${(scorecard.discipline || 0)}%` }}
                  ></div>
                </div>
                <div className="text-right text-sm">{scorecard.discipline ?? 0}%</div>
              </div>
            </div>
          </div>
          </>
        )}
      </div>
    </>
  );
}