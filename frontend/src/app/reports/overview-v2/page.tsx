'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { reportsApi } from '@/lib/api';
import Header from '@/components/Header';

type CaseStatus = 'NEW' | 'PROPOSED' | 'APPROVED' | 'IN_PROGRESS' | 'DONE' | 'PARTIAL' | 'FAILED' | 'CANCELLED';

const STATUS_CONFIG: Record<CaseStatus, { label: string; color: string; bgColor: string; icon: string }> = {
  NEW: { label: 'Нов', color: '#6b7280', bgColor: '#f3f4f6', icon: '📧' },
  PROPOSED: { label: 'Предложен', color: '#f59e0b', bgColor: '#fef3c7', icon: '⏳' },
  APPROVED: { label: 'Одобрен', color: '#3b82f6', bgColor: '#dbeafe', icon: '✅' },
  IN_PROGRESS: { label: 'Во тек', color: '#8b5cf6', bgColor: '#ede9fe', icon: '🔄' },
  DONE: { label: 'Завршен', color: '#10b981', bgColor: '#d1fae5', icon: '🎉' },
  PARTIAL: { label: 'Делумен', color: '#f97316', bgColor: '#ffedd5', icon: '⚠️' },
  FAILED: { label: 'Неуспешен', color: '#ef4444', bgColor: '#fee2e2', icon: '❌' },
  CANCELLED: { label: 'Откажан', color: '#6b7280', bgColor: '#f3f4f6', icon: '🚫' },
};

interface KpiCardProps {
  label: string;
  value: string | number;
  subLabel?: string;
  color?: string;
  onClick?: () => void;
}

function KpiCard({ label, value, subLabel, color, onClick }: KpiCardProps) {
  return (
    <div 
      className="card" 
      style={{ 
        textAlign: 'center', 
        cursor: onClick ? 'pointer' : 'default',
        border: '2px solid transparent',
        transition: 'all 0.2s',
      }}
      onClick={onClick}
      onMouseEnter={(e) => onClick && (e.currentTarget.style.borderColor = color || '#3b82f6')}
      onMouseLeave={(e) => onClick && (e.currentTarget.style.borderColor = 'transparent')}
    >
      <div style={{ fontSize: '28px', fontWeight: 'bold', color: color || '#1f2937' }}>
        {value}
      </div>
      <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>{label}</div>
      {subLabel && <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>{subLabel}</div>}
    </div>
  );
}

interface StatusCardProps {
  status: CaseStatus;
  count: number;
  onClick: () => void;
}

function StatusCard({ status, count, onClick }: StatusCardProps) {
  const config = STATUS_CONFIG[status];
  return (
    <div 
      className="card" 
      style={{ 
        cursor: 'pointer',
        background: config.bgColor,
        border: `2px solid ${config.color}`,
        transition: 'all 0.2s',
      }}
      onClick={onClick}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = `0 4px 12px ${config.color}40`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div style={{ fontSize: '32px', marginBottom: '8px' }}>{config.icon}</div>
      <div style={{ fontSize: '28px', fontWeight: 'bold', color: config.color }}>
        {count}
      </div>
      <div style={{ fontSize: '14px', color: config.color }}>{config.label}</div>
    </div>
  );
}

interface TrendDataPoint {
  period: string;
  totalCases: number;
  otifRate: number;
  onTimeRate: number;
  inFullRate: number;
}

interface SimpleLineChartProps {
  data: TrendDataPoint[];
  height?: number;
}

function SimpleLineChart({ data, height = 200 }: SimpleLineChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    if (!canvasRef.current || data.length === 0) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);
    
    const width = rect.width;
    const chartHeight = height - 40;
    const padding = { top: 20, right: 20, bottom: 40, left: 50 };
    const chartWidth = width - padding.left - padding.right;
    
    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    
    // Find max value for scaling
    const maxValue = 100; // Always 100 for percentages
    const minValue = 0;
    const range = maxValue - minValue;
    
    // Draw grid lines
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (chartHeight / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();
      
      // Labels
      ctx.fillStyle = '#6b7280';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`${100 - i * 25}%`, padding.left - 5, y + 3);
    }
    
    // Calculate point positions
    const getX = (index: number) => padding.left + (index / (data.length - 1 || 1)) * chartWidth;
    const getY = (value: number) => padding.top + ((maxValue - value) / range) * chartHeight;
    
    // Draw lines for each metric
    const metrics = [
      { key: 'otifRate', color: '#10b981', label: 'OTIF' },
      { key: 'onTimeRate', color: '#3b82f6', label: 'On-Time' },
      { key: 'inFullRate', color: '#8b5cf6', label: 'In-Full' },
    ];
    
    metrics.forEach((metric, metricIndex) => {
      // Draw line
      ctx.strokeStyle = metric.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      data.forEach((point, i) => {
        const value = point[metric.key as keyof TrendDataPoint] as number;
        const x = getX(i);
        const y = getY(value);
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();
      
      // Draw points
      data.forEach((point, i) => {
        const value = point[metric.key as keyof TrendDataPoint] as number;
        const x = getX(i);
        const y = getY(value);
        
        ctx.fillStyle = metric.color;
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
      });
    });
    
    // Draw X-axis labels
    ctx.fillStyle = '#6b7280';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    
    // Show every nth label based on data length
    const step = Math.max(1, Math.floor(data.length / 6));
    data.forEach((point, i) => {
      if (i % step === 0 || i === data.length - 1) {
        const x = getX(i);
        const label = point.period.length > 8 ? point.period.substring(5) : point.period;
        ctx.fillText(label, x, height - 10);
      }
    });
    
    // Draw legend
    const legendY = height - 25;
    const legendStartX = width / 2 - 100;
    metrics.forEach((metric, i) => {
      const x = legendStartX + i * 80;
      
      // Line
      ctx.strokeStyle = metric.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, legendY);
      ctx.lineTo(x + 20, legendY);
      ctx.stroke();
      
      // Dot
      ctx.fillStyle = metric.color;
      ctx.beginPath();
      ctx.arc(x + 10, legendY, 4, 0, Math.PI * 2);
      ctx.fill();
      
      // Label
      ctx.fillStyle = '#374151';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(metric.label, x + 25, legendY + 4);
    });
    
  }, [data, height]);
  
  return (
    <canvas 
      ref={canvasRef} 
      style={{ width: '100%', height: `${height}px` }}
    />
  );
}

interface Case {
  id: string;
  caseStatus: string;
  caseDueAt: string | null;
  completedAt: string | null;
  isOtif: boolean | null;
  isOnTime: boolean | null;
  isInFull: boolean | null;
  email: {
    subject: string;
    sender: string;
    receivedAt: string;
  };
  supplierName: string | null;
  locationName: string | null;
  totalTasks: number;
  completedTasks: number;
}

export default function ReportsOverviewV2Page() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<any>(null);
  const [selectedStatus, setSelectedStatus] = useState<CaseStatus | null>(null);
  const [cases, setCases] = useState<Case[]>([]);
  const [casesLoading, setCasesLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [dateRange, setDateRange] = useState<{ from?: string; to?: string }>({});
  const [trendData, setTrendData] = useState<TrendDataPoint[]>([]);
  const [trendLoading, setTrendLoading] = useState(false);
  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month'>('day');

  const userRole = (session?.user as any)?.role;
  const isManager = userRole === 'MANAGER' || userRole === 'ADMIN';

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/api/auth/signin');
    } else if (status === 'authenticated' && !isManager) {
      router.push('/');
    }
  }, [status, router, isManager]);

  useEffect(() => {
    if (session && isManager) {
      loadOverview();
      loadTrendData();
    }
  }, [session, isManager, dateRange, groupBy]);

  async function loadOverview() {
    try {
      setLoading(true);
      const data = await reportsApi.getOverviewV2(dateRange);
      setOverview(data);
    } catch (error) {
      console.error('Failed to load overview:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadTrendData() {
    try {
      setTrendLoading(true);
      const data = await reportsApi.getOtifTrend({
        from: dateRange.from,
        to: dateRange.to,
        groupBy,
      });
      // Transform data to match our interface
      const transformedData: TrendDataPoint[] = (data as any[]).map(item => ({
        period: item.period,
        totalCases: item.totalCases,
        otifRate: Math.round(item.otifRate || 0),
        onTimeRate: Math.round(item.onTimeRate || 0),
        inFullRate: Math.round(item.inFullRate || 0),
      }));
      setTrendData(transformedData);
    } catch (error) {
      console.error('Failed to load trend data:', error);
      setTrendData([]);
    } finally {
      setTrendLoading(false);
    }
  }

  async function loadCasesByStatus(status: CaseStatus) {
    try {
      setCasesLoading(true);
      const data = await reportsApi.getCasesByStatus({
        status,
        from: dateRange.from,
        to: dateRange.to,
        page,
        pageSize: 20,
      });
      setCases(data.cases);
      setTotalPages(data.totalPages);
      setSelectedStatus(status);
    } catch (error) {
      console.error('Failed to load cases:', error);
    } finally {
      setCasesLoading(false);
    }
  }

  function closeDrilldown() {
    setSelectedStatus(null);
    setCases([]);
    setPage(1);
  }

  function formatMinutes(minutes: number): string {
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  }

  function formatDate(dateStr: string | null): string {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('mk-MK');
  }

  if (loading) {
    return (
      <div>
        <Header isManager={true} />
        <div className="container">
          <div className="empty-state">
            <h3>Loading...</h3>
          </div>
        </div>
      </div>
    );
  }

  if (!overview) {
    return (
      <div>
        <Header isManager={true} />
        <div className="container">
          <div className="empty-state">
            <h3>No data available</h3>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header isManager={true} />
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h1>📊 Reports Overview v2</h1>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <input
              type="date"
              className="form-input"
              value={dateRange.from || ''}
              onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
              style={{ padding: '8px' }}
            />
            <span>до</span>
            <input
              type="date"
              className="form-input"
              value={dateRange.to || ''}
              onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
              style={{ padding: '8px' }}
            />
            {(dateRange.from || dateRange.to) && (
              <button className="btn btn-secondary" onClick={() => setDateRange({})}>
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Total Cases */}
        <div className="card" style={{ marginBottom: '24px', textAlign: 'center', padding: '24px' }}>
          <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#1f2937' }}>
            {overview.totalCases}
          </div>
          <div style={{ fontSize: '18px', color: '#6b7280' }}>Вкупни Cases</div>
          {overview.casesWithKpiData > 0 && (
            <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '8px' }}>
              {overview.casesWithKpiData} завршени (со KPIs)
            </div>
          )}
        </div>

        {/* KPI Cards */}
        <h2 style={{ marginBottom: '16px' }}>📈 KPI Metrics</h2>
        <div className="grid grid-3" style={{ marginBottom: '24px' }}>
          <KpiCard 
            label="OTIF Rate" 
            value={`${overview.kpis.otifRate}%`} 
            subLabel={overview.casesWithKpiData > 0 ? `${overview.kpis.otifCases} cases` : 'Нема податоци'}
            color="#10b981"
          />
          <KpiCard 
            label="On-Time Rate" 
            value={`${overview.kpis.onTimeRate}%`} 
            subLabel={overview.casesWithKpiData > 0 ? `${overview.kpis.onTimeCases} cases` : 'Нема податоци'}
            color="#3b82f6"
          />
          <KpiCard 
            label="In-Full Rate" 
            value={`${overview.kpis.inFullRate}%`} 
            subLabel={overview.casesWithKpiData > 0 ? `${overview.kpis.inFullCases} cases` : 'Нема податоци'}
            color="#8b5cf6"
          />
          <KpiCard 
            label="Overdue Cases" 
            value={overview.kpis.overdueCases}
            subLabel="Needs attention"
            color={overview.kpis.overdueCases > 0 ? "#ef4444" : '#10b981'}
          />
          <KpiCard 
            label="Avg Approval Time" 
            value={overview.kpis.avgApprovalMinutes > 0 ? formatMinutes(overview.kpis.avgApprovalMinutes) : '-'}
            subLabel="From received to approved"
            color="#f59e0b"
          />
          <KpiCard 
            label="Avg Execution Time" 
            value={overview.kpis.avgExecutionMinutes > 0 ? formatMinutes(overview.kpis.avgExecutionMinutes) : '-'}
            subLabel="From approved to completed"
            color="#06b6d4"
          />
        </div>

        {/* OTIF Trend Chart */}
        <h2 style={{ marginBottom: '16px' }}>📉 OTIF Trend</h2>
        <div className="card" style={{ marginBottom: '24px', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              {(['day', 'week', 'month'] as const).map((g) => (
                <button
                  key={g}
                  className={`btn ${groupBy === g ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setGroupBy(g)}
                  style={{ padding: '4px 12px', fontSize: '13px' }}
                >
                  {g === 'day' ? 'Ден' : g === 'week' ? 'Недела' : 'Месец'}
                </button>
              ))}
            </div>
          </div>
          
          {trendLoading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>Loading...</div>
          ) : trendData.length > 0 ? (
            <SimpleLineChart data={trendData} height={220} />
          ) : (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px', 
              color: '#6b7280',
              background: '#f9fafb',
              borderRadius: '8px'
            }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>📊</div>
              <div>Нема доволно податоци за trend анализа</div>
              <div style={{ fontSize: '12px', marginTop: '4px', color: '#9ca3af' }}>
                Податоци ќе се појават откако ќе се завршат повеќе cases
              </div>
            </div>
          )}
        </div>

        {/* Case Status Breakdown */}
        <h2 style={{ marginBottom: '16px' }}>📋 Case Status Breakdown</h2>
        <div className="grid grid-4" style={{ marginBottom: '24px' }}>
          {(Object.keys(STATUS_CONFIG) as CaseStatus[]).map((status) => (
            <StatusCard
              key={status}
              status={status}
              count={overview.statusCounts[status] || 0}
              onClick={() => loadCasesByStatus(status)}
            />
          ))}
        </div>

        {/* Drilldown Panel */}
        {selectedStatus && (
          <div className="card" style={{ marginTop: '24px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ margin: 0 }}>
                {STATUS_CONFIG[selectedStatus].icon} Cases: {STATUS_CONFIG[selectedStatus].label}
              </h2>
              <button className="btn btn-secondary" onClick={closeDrilldown}>
                ✕ Close
              </button>
            </div>

            {casesLoading ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>
            ) : cases.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                No cases found
              </div>
            ) : (
              <>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Subject</th>
                      <th>Supplier</th>
                      <th>Location</th>
                      <th>Due Date</th>
                      <th>Completed</th>
                      <th>Progress</th>
                      <th>OTIF</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cases.map((c) => (
                      <tr key={c.id}>
                        <td>
                          <a href={`/emails/${c.id}`} style={{ color: '#0078d4' }}>
                            {c.email?.subject?.substring(0, 40) || '-'}
                            {(c.email?.subject?.length || 0) > 40 ? '...' : ''}
                          </a>
                        </td>
                        <td>{c.supplierName || '-'}</td>
                        <td>{c.locationName || '-'}</td>
                        <td>{formatDate(c.caseDueAt)}</td>
                        <td>{formatDate(c.completedAt)}</td>
                        <td>
                          {c.completedTasks || 0}/{c.totalTasks || 0}
                        </td>
                        <td>
                          {c.isOtif === true && <span style={{ color: '#10b981' }}>✅</span>}
                          {c.isOtif === false && <span style={{ color: '#ef4444' }}>❌</span>}
                          {c.isOtif === null && <span style={{ color: '#9ca3af' }}>-</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '16px' }}>
                    <button 
                      className="btn btn-secondary" 
                      disabled={page <= 1}
                      onClick={() => { setPage(page - 1); loadCasesByStatus(selectedStatus); }}
                    >
                      ← Prev
                    </button>
                    <span style={{ padding: '8px 16px', alignSelf: 'center' }}>
                      Page {page} of {totalPages}
                    </span>
                    <button 
                      className="btn btn-secondary" 
                      disabled={page >= totalPages}
                      onClick={() => { setPage(page + 1); loadCasesByStatus(selectedStatus); }}
                    >
                      Next →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}