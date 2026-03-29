'use client';

import { useState, useEffect } from 'react';
import { performanceApi, userApi } from '@/lib/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

const MONTHS = [
  { value: 1, label: 'Јануари' },
  { value: 2, label: 'Февруари' },
  { value: 3, label: 'Март' },
  { value: 4, label: 'Април' },
  { value: 5, label: 'Мај' },
  { value: 6, label: 'Јуни' },
  { value: 7, label: 'Јули' },
  { value: 8, label: 'Август' },
  { value: 9, label: 'Септември' },
  { value: 10, label: 'Октомври' },
  { value: 11, label: 'Ноември' },
  { value: 12, label: 'Декември' },
];

interface KpiFormData {
  userId: string;
  month: number;
  year: number;
  tidiness: number;
  discipline: number;
  organization: number;
  fuel: number;
  incidents: number;
  returns48h: number;
  activeRole: string;
}

export default function AdminKpiPage() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [coordinators, setCoordinators] = useState<User[]>([]);
  
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedUser, setSelectedUser] = useState('');
  
  const [formData, setFormData] = useState<KpiFormData>({
    userId: '',
    month: selectedMonth,
    year: selectedYear,
    tidiness: 0,
    discipline: 0,
    organization: 0,
    fuel: 0,
    incidents: 0,
    returns48h: 0,
    activeRole: '',
  });

  useEffect(() => {
    loadCoordinators();
  }, []);

  useEffect(() => {
    loadExistingKpi();
  }, [selectedUser, selectedMonth, selectedYear]);

  async function loadCoordinators() {
    try {
      const data = await userApi.getCoordinators();
      setCoordinators(data as User[]);
      if (data.length > 0 && !selectedUser) {
        setSelectedUser(data[0].id);
      }
    } catch (err) {
      console.error('Failed to load coordinators:', err);
    }
  }

  async function loadExistingKpi() {
    if (!selectedUser) return;
    try {
      const data = await performanceApi.getMetrics(selectedUser, {
        month: selectedMonth,
        year: selectedYear,
      });
      if (data) {
        setFormData({
          userId: selectedUser,
          month: selectedMonth,
          year: selectedYear,
          tidiness: (data as any).tidiness || 0,
          discipline: (data as any).discipline || 0,
          organization: (data as any).organization || 0,
          fuel: (data as any).fuel || 0,
          incidents: (data as any).incidents || 0,
          returns48h: (data as any).returns48h || 0,
          activeRole: (data as any).activeRole || '',
        });
      }
    } catch (err) {
      // No existing KPI, use defaults
      setFormData(prev => ({ ...prev, userId: selectedUser }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await performanceApi.updateKPI({
        userId: selectedUser,
        month: selectedMonth,
        year: selectedYear,
        tidiness: formData.tidiness,
        discipline: formData.discipline,
        organization: formData.organization,
        fuel: formData.fuel,
        incidents: formData.incidents,
        returns48h: formData.returns48h,
        activeRole: formData.activeRole,
      });
      setSuccess('KPI успешно зачувано!');
    } catch (err) {
      console.error('Failed to save KPI:', err);
      setError('Грешка при зачувување. Обидете се повторно.');
    } finally {
      setSaving(false);
    }
  }

  function getSelectedUserName(): string {
    const user = coordinators.find(c => c.id === selectedUser);
    return user?.name || 'Избери координатор';
  }

  function getRoleLabel(role: string): string {
    const labels: Record<string, string> = {
      RECEPTION_COORDINATOR: 'Прием',
      DELIVERY_COORDINATOR: 'Испорака',
      DISTRIBUTION_COORDINATOR: 'Дистрибуција',
    };
    return labels[role] || role;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">К управување со KPI</h1>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex gap-4">
          <div>
            <label className="block text-sm text-gray-500 mb-1">Месец</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="px-3 py-2 border rounded w-40"
            >
              {MONTHS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-500 mb-1">Година</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="px-3 py-2 border rounded w-24"
            >
              <option value={2026}>2026</option>
              <option value={2025}>2025</option>
              <option value={2024}>2024</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-500 mb-1">Координатор</label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="px-3 py-2 border rounded w-48"
            >
              {coordinators.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4 text-green-700">
          {success}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">
          KPI за {getSelectedUserName()} - {MONTHS[selectedMonth - 1].label} {selectedYear}
        </h2>

        <div className="grid grid-cols-2 gap-6">
          {/* Manual Scoring (0-100) */}
          <div>
            <h3 className="text-md font-medium mb-3 text-gray-600">Мануелно бодирање</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-500 mb-1">Тиролина (0-100)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.tidiness}
                  onChange={(e) => setFormData({ ...formData, tidiness: parseInt(e.target.value) || 0 })}
                  className="px-3 py-2 border rounded w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-500 mb-1">Дисциплина (0-100)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.discipline}
                  onChange={(e) => setFormData({ ...formData, discipline: parseInt(e.target.value) || 0 })}
                  className="px-3 py-2 border rounded w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-500 mb-1">Организацијa (0-100)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.organization}
                  onChange={(e) => setFormData({ ...formData, organization: parseInt(e.target.value) || 0 })}
                  className="px-3 py-2 border rounded w-full"
                />
              </div>
            </div>
          </div>

          {/* Bonus Qualifications */}
          <div>
            <h3 className="text-md font-medium mb-3 text-gray-600">Бонус квалификации</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-500 mb-1">Гориво (0-100)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.fuel}
                  onChange={(e) => setFormData({ ...formData, fuel: parseInt(e.target.value) || 0 })}
                  className="px-3 py-2 border rounded w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-500 mb-1">Инциденти (број)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.incidents}
                  onChange={(e) => setFormData({ ...formData, incidents: parseInt(e.target.value) || 0 })}
                  className="px-3 py-2 border rounded w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-500 mb-1">Враќања 48ч (број)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.returns48h}
                  onChange={(e) => setFormData({ ...formData, returns48h: parseInt(e.target.value) || 0 })}
                  className="px-3 py-2 border rounded w-full"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Active Role */}
        <div className="mt-6">
          <label className="block text-sm text-gray-500 mb-1">Активна улога</label>
          <select
            value={formData.activeRole}
            onChange={(e) => setFormData({ ...formData, activeRole: e.target.value })}
            className="px-3 py-2 border rounded w-64"
          >
            <option value="">Автоматски</option>
            <option value="RECEPTION_COORDINATOR">Прием</option>
            <option value="DELIVERY_COORDINATOR">Испорака</option>
            <option value="DISTRIBUTION_COORDINATOR">Дистрибуција</option>
          </select>
        </div>

        {/* Submit */}
        <div className="mt-6 flex gap-4">
          <button
            type="submit"
            disabled={saving || !selectedUser}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Зачувувам...' : 'Зачувај KPI'}
          </button>
          <button
            type="button"
            onClick={() => performanceApi.recalculate(selectedUser, { month: selectedMonth, year: selectedYear })}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            Пресметај од задачи
          </button>
        </div>
      </form>
    </div>
  );
}