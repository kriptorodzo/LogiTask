'use client';

interface KpiCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  trend?: 'up' | 'down' | 'neutral';
  color?: 'blue' | 'green' | 'purple' | 'yellow' | 'red' | 'honey';
}

export default function KpiCard({ 
  label, 
  value, 
  subtext, 
  trend,
  color = 'blue' 
}: KpiCardProps) {
  const colorClasses: Record<string, string> = {
    blue: 'border-l-blue-500',
    green: 'border-l-green-500',
    purple: 'border-l-purple-500',
    yellow: 'border-l-yellow-500',
    red: 'border-l-red-500',
    honey: 'border-l-honey',
  };

  return (
    <div className={`kpi-card ${colorClasses[color]}`}>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      {subtext && <div className="kpi-subtext">{subtext}</div>}
      {trend && (
        <div className={`kpi-trend ${trend}`}>
          {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
        </div>
      )}
    </div>
  );
}