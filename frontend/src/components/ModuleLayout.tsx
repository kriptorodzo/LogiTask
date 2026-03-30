'use client';

import TopBar from './TopBar';
import BackButton from './BackButton';

interface ModuleLayoutProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: { label: string; href?: string }[];
  actions?: React.ReactNode;
  backHref?: string;
  backLabel?: string;
  children: React.ReactNode;
}

export default function ModuleLayout({ 
  title, 
  subtitle, 
  breadcrumbs, 
  actions,
  backHref,
  backLabel,
  children 
}: ModuleLayoutProps) {
  return (
    <>
      <TopBar 
        title={title}
        subtitle={subtitle}
        breadcrumbs={breadcrumbs}
        actions={
          <>
            {actions}
            {backHref && (
              <BackButton href={backHref} label={backLabel || 'Back'} />
            )}
          </>
        }
      />
      <div className="page-content">
        {children}
      </div>
    </>
  );
}