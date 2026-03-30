'use client';

import Link from 'next/link';
import PageShell from '@/components/PageShell';

const adminModules = [
  {
    title: 'ERP Management',
    description: 'Documents, routes, and import management',
    href: '/admin/erp',
    icon: '🏭',
  },
  {
    title: 'Performance Settings',
    description: 'KPI configuration and bonus bands',
    href: '/admin/performance',
    icon: '🏆',
  },
];

export default function AdminPage() {
  return (
    <PageShell title="Admin" subtitle="System configuration and management">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {adminModules.map((module) => (
          <Link
            key={module.href}
            href={module.href}
            className="block p-6 bg-white rounded-lg border border-gray-200 hover:border-blue-500 transition-colors"
          >
            <div className="flex items-center gap-4">
              <span className="text-4xl">{module.icon}</span>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{module.title}</h3>
                <p className="text-gray-500">{module.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </PageShell>
  );
}
