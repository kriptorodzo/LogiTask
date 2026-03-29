'use client';

import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { useSession } from 'next-auth/react';

interface TopBarProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: { label: string; href?: string }[];
  actions?: React.ReactNode;
}

export default function TopBar({ title, subtitle, breadcrumbs, actions }: TopBarProps) {
  const { data: session } = useSession();

  return (
    <header className="topbar">
      <div className="topbar-left">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <div className="breadcrumbs">
            {breadcrumbs.map((crumb, index) => (
              <span key={index}>
                {crumb.href ? (
                  <Link href={crumb.href} className="breadcrumb-link">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="breadcrumb-current">{crumb.label}</span>
                )}
                {index < breadcrumbs.length - 1 && (
                  <span className="breadcrumb-sep"> / </span>
                )}
              </span>
            ))}
          </div>
        )}
        <div className="page-title-group">
          <h1 className="page-title">{title}</h1>
          {subtitle && <p className="page-subtitle">{subtitle}</p>}
        </div>
      </div>
      
      <div className="topbar-right">
        {actions && <div className="topbar-actions">{actions}</div>}
        
        <div className="user-menu">
          <span className="user-name">{(session?.user as any)?.name || 'User'}</span>
          <button 
            onClick={() => signOut()} 
            className="signout-btn"
          >
            Sign Out
          </button>
        </div>
      </div>
    </header>
  );
}