'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * @deprecated This page has been migrated to /inbound
 * Redirecting to the new workflow...
 */
export default function TaskDetailPage() {
  const router = useRouter();

  useEffect(() => {
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
      <p>Пренасочувам кон новиот детален приказ...</p>
    </div>
  );
}
