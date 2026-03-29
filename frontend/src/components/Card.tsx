'use client';

interface CardProps {
  title?: string;
  icon?: string;
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
  noPadding?: boolean;
}

export default function Card({ 
  title, 
  icon, 
  children, 
  className = '',
  actions,
  noPadding = false 
}: CardProps) {
  return (
    <div className={`card ${className}`}>
      {(title || actions) && (
        <div className="card-header">
          {title && (
            <div className="card-title">
              {icon && <span className="card-icon">{icon}</span>}
              <h3>{title}</h3>
            </div>
          )}
          {actions && <div className="card-actions">{actions}</div>}
        </div>
      )}
      <div className={`card-content ${noPadding ? 'no-padding' : ''}`}>
        {children}
      </div>
    </div>
  );
}