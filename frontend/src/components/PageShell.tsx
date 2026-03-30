'use client';

import TopBar from '@/components/TopBar';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface PageShellProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  showBack?: boolean;
  backHref?: string;
}

const MODULE_BREADCRUMBS: Record<string, { label: string; href?: string }[]> = {
  // Reports
  '/reports': [
    { label: 'Reports' },
  ],
  '/reports/coordinators': [
    { label: 'Reports', href: '/reports' },
    { label: 'Coordinators' },
  ],
  '/reports/cases': [
    { label: 'Reports', href: '/reports' },
    { label: 'Cases' },
  ],
  '/reports/scorecard': [
    { label: 'Reports', href: '/reports' },
    { label: 'Scorecard' },
  ],
  '/reports/overview-v2': [
    { label: 'Reports', href: '/reports' },
    { label: 'Overview' },
  ],
  // Admin
  '/admin': [
    { label: 'Admin' },
  ],
  '/admin/erp': [
    { label: 'Admin', href: '/admin' },
    { label: 'ERP' },
  ],
  '/admin/performance': [
    { label: 'Admin', href: '/admin' },
    { label: 'Performance' },
  ],
  '/admin/erp/routes': [
    { label: 'Admin', href: '/admin' },
    { label: 'ERP', href: '/admin/erp' },
    { label: 'Route Plans' },
  ],
  '/admin/erp/import': [
    { label: 'Admin', href: '/admin' },
    { label: 'ERP', href: '/admin/erp' },
    { label: 'Import' },
  ],
  // Performance
  '/performance/leaderboard': [
    { label: 'Performance', href: '/performance/leaderboard' },
    { label: 'Leaderboard' },
  ],
  '/performance/scorecard': [
    { label: 'Performance', href: '/performance/leaderboard' },
    { label: 'Scorecard' },
  ],
  // Module level
  '/manager': [
    { label: 'Manager' },
  ],
  '/coordinator': [
    { label: 'Coordinator' },
  ],
  // Email detail
  '/emails/[id]': [
    { label: 'Manager', href: '/manager' },
    { label: 'Email' },
  ],
  // Task detail
  '/tasks/[id]': [
    { label: 'Tasks', href: '/coordinator' },
    { label: 'Task' },
  ],
};

export default function PageShell({ children, title, subtitle, showBack, backHref }: PageShellProps) {
  const pathname = usePathname();
  const breadcrumbs = MODULE_BREADCRUMBS[pathname] || [];
  
  if (showBack && backHref) {
    breadcrumbs.unshift({ label: 'Back', href: backHref });
  }

  return (
    <>
      <TopBar 
        title={title}
        subtitle={subtitle}
        breadcrumbs={breadcrumbs}
      />
      <div className="page-content">
        {children}
      </div>
    </>
  );
}