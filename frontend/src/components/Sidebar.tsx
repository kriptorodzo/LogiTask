'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';

// Role-based navigation configuration
const NAV_CONFIG = {
  MANAGER: [
    { href: '/', label: 'Dashboard', icon: '📊' },
    { href: '/inbound', label: 'Inbox', icon: '📥' },
    { href: '/reports', label: 'Reports', icon: '📈' },
    { href: '/admin/erp', label: 'ERP', icon: '🏭' },
    { href: '/admin/performance', label: 'Performance', icon: '🏆' },
  ],
  RECEPTION_COORDINATOR: [
    { href: '/', label: 'Dashboard', icon: '📊' },
    { href: '/inbound', label: 'My Tasks', icon: '📋' },
  ],
  DELIVERY_COORDINATOR: [
    { href: '/', label: 'Dashboard', icon: '📊' },
    { href: '/inbound', label: 'My Tasks', icon: '📋' },
  ],
  DISTRIBUTION_COORDINATOR: [
    { href: '/', label: 'Dashboard', icon: '📊' },
    { href: '/inbound', label: 'My Tasks', icon: '📋' },
  ],
  ADMIN: [
    { href: '/admin', label: 'Admin', icon: '⚙️' },
    { href: '/admin/erp', label: 'ERP', icon: '🏭' },
    { href: '/admin/performance', label: 'Performance', icon: '🏆' },
    { href: '/reports', label: 'Reports', icon: '📈' },
  ],
};

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  
  // Get role from session
  const userRole = (session?.user as any)?.role || 'RECEPTION_COORDINATOR';
  
  // Get navigation items for this role
  const navItems = NAV_CONFIG[userRole as keyof typeof NAV_CONFIG] || NAV_CONFIG.RECEPTION_COORDINATOR;

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
      
      {/* Role indicator */}
      <div style={{ 
        position: 'absolute', 
        bottom: '20px', 
        left: '20px', 
        right: '20px',
        padding: '12px',
        background: '#f5f5f5',
        borderRadius: '8px',
        fontSize: '12px',
        color: '#666'
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Role:</div>
        <div>{userRole.replace('_', ' ')}</div>
      </div>
    </aside>
  );
}