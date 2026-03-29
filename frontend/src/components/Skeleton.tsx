'use client';

interface SkeletonProps {
  width?: string;
  height?: string;
  borderRadius?: string;
  className?: string;
}

export function Skeleton({ 
  width = '100%', 
  height = '20px', 
  borderRadius = '4px',
  className = '' 
}: SkeletonProps) {
  return (
    <div 
      className={`skeleton ${className}`}
      style={{ 
        width, 
        height, 
        borderRadius,
      }} 
    />
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="skeleton-table">
      {/* Header */}
      <div className="skeleton-row">
        {[120, 150, 100, 100, 120].map((w, i) => (
          <Skeleton key={i} width={`${w}px`} height="16px" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="skeleton-row">
          {[180, 140, 80, 80, 100].map((w, i) => (
            <Skeleton key={i} width={`${w}px`} height="14px" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <Skeleton width="60%" height="20px" />
      <Skeleton width="40%" height="32px" />
      <Skeleton width="80%" height="14px" />
    </div>
  );
}

export function SkeletonList({ count = 5 }: { count?: number }) {
  return (
    <div className="skeleton-list">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton-list-item">
          <Skeleton width="40px" height="40px" borderRadius="50%" />
          <div style={{ flex: 1 }}>
            <Skeleton width="70%" height="16px" />
            <Skeleton width="40%" height="12px" />
          </div>
        </div>
      ))}
    </div>
  );
}