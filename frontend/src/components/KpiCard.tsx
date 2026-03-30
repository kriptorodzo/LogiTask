'use client';

interface KpiCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  trend?: 'up' | 'down' | 'neutral';
  color?: 'blue' | 'green' | 'purple' | 'yellow' | 'red' | 'honey' | 'orange';
  icon?: string;
}

export default function KpiCard({ 
  label, 
  value, 
  subtext, 
  trend,
  color = 'blue',
  icon
}: KpiCardProps) {
  const colorClasses: Record<string, string> = {
    blue: 'border-l-blue-500',
    green: 'border-l-green-500',
    purple: 'border-l-purple-500',
    yellow: 'border-l-yellow-500',
    red: 'border-l-red-500',
    honey: 'border-l-honey',
    orange: 'border-l-orange-500',
  };

  return (
    <div className={`kpi-card ${colorClasses[color]}`}>
      {icon && <div className="kpi-icon">{icon}</div>}
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