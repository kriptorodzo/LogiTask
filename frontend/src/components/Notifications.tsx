'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { taskApi } from '@/lib/api';


interface NotificationItem {
  id: string;
  action: string;
  details: {
    title?: string;
    message?: string;
    type?: string;
  };
  createdAt: string;
}

export default function Notifications() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/api/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      loadNotifications();
    }
  }, [session]);

  async function loadNotifications() {
    try {
      // For MVP, fetch recent tasks that have been modified
      // In production, this would call the notifications API
      const tasks = await taskApi.getAll({ status: 'APPROVED' });
      
      // Convert to notification format (mock for MVP)
      const notifs: NotificationItem[] = tasks.slice(0, 5).map((task: any) => ({
        id: task.id,
        action: 'NOTIFICATION_TASK_ASSIGNED',
        details: {
          title: 'Task Assigned',
          message: `You have been assigned: ${task.title}`,
          type: 'TASK_ASSIGNED',
        },
        createdAt: task.updatedAt,
      }));
      
      setNotifications(notifs);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div style={{ padding: '16px', color: '#666' }}>Loading notifications...</div>;
  }

  if (notifications.length === 0) {
    return (
      <div style={{ padding: '16px', color: '#666' }}>
        <p>No notifications</p>
      </div>
    );
  }

  return (
    <div style={{ maxHeight: '400px', overflow: 'auto' }}>
      {notifications.map((notification) => (
        <div
          key={notification.id}
          style={{
            padding: '12px 16px',
            borderBottom: '1px solid #eee',
            cursor: 'pointer',
            transition: 'background 0.2s',
          }}
          onClick={() => router.push(`/tasks/${notification.id}`)}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#f5f5f5')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <p style={{ fontWeight: '500', marginBottom: '4px' }}>
            {notification.details.title}
          </p>
          <p style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>
            {notification.details.message}
          </p>
          <p style={{ fontSize: '12px', color: '#999' }}>
            {new Date(notification.createdAt).toLocaleString()}
          </p>
        </div>
      ))}
    </div>
  );
}