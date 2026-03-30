'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * @deprecated This page has been migrated to /inbound
 * Redirecting to the new Inbound workflow...
 */
export default function ManagerInboxPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to new inbound page
    router.replace('/inbound');
  }, [router]);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      flexDirection: 'column',
      gap: '16px'
    }}>
      <div className="loading-spinner"></div>
      <p>Пренасочувам кон новиот Inbox...</p>
      <p style={{ fontSize: '14px', color: '#666' }}>
        <a href="/inbound" style={{ color: '#1976d2' }}>Кликни тука ако не чекаш</a>
      </p>
    </div>
  );
}
