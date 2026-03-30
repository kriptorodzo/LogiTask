'use client';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  PROPOSED: { label: 'Proposed', className: 'status-proposed' },
  APPROVED: { label: 'Approved', className: 'status-approved' },
  REJECTED: { label: 'Rejected', className: 'status-rejected' },
  IN_PROGRESS: { label: 'In Progress', className: 'status-in-progress' },
  DONE: { label: 'Done', className: 'status-done' },
  CANCELLED: { label: 'Cancelled', className: 'status-cancelled' },
  PENDING: { label: 'Pending', className: 'status-pending' },
  PROCESSED: { label: 'Processed', className: 'status-processed' },
};

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] || { label: status, className: 'status-default' };
  
  return (
    <span className={`status-badge ${config.className} status-${size}`}>
      {config.label}
    </span>
  );
}