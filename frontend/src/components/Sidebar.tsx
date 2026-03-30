'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/', label: 'Dashboard', icon: '📊' },
  { href: '/manager', label: 'Manager Inbox', icon: '📥' },
  { href: '/coordinator', label: 'Coordinator', icon: '📋' },
  { href: '/reports', label: 'Reports', icon: '📈' },
  { href: '/performance/leaderboard', label: 'Performance', icon: '🏆' },
  { href: '/admin/erp', label: 'ERP', icon: '🏭' },
  { href: '/admin/performance', label: 'Settings', icon: '⚙️' },
];

export default function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <span className="logo-icon">📦</span>
        <span className="logo-text">LogiTask</span>
      </div>
      
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-item ${isActive(item.href) ? 'active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}