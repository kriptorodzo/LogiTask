'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { notificationApi } from '@/lib/api';

interface HeaderProps {
  isManager?: boolean;
  showNotifications?: boolean;
}

export default function Header({ isManager = false, showNotifications = true }: HeaderProps) {
  const { data: session } = useSession();
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showNotifications && session) {
      loadNotifications();
    }
  }, [session, showNotifications]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function loadNotifications() {
    try {
      const data = await notificationApi.getAll(5);
      setNotifications(data);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  }

  return (
    <header className="header">
      <h1>Logistics Email Processor</h1>
      <nav className="nav">
        <Link href="/">Dashboard</Link>
        {isManager && <Link href="/manager">Manager Inbox</Link>}
        {showNotifications && (
          <div style={{ position: 'relative' }} ref={dropdownRef}>
            <button
              onClick={() => setShowNotifDropdown(!showNotifDropdown)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '8px',
                position: 'relative',
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
              {notifications.length > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '4px',
                    right: '4px',
                    background: '#d13438',
                    color: 'white',
                    borderRadius: '50%',
                    width: '16px',
                    height: '16px',
                    fontSize: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {notifications.length}
                </span>
              )}
            </button>
            {showNotifDropdown && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: '0',
                  background: 'white',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                  minWidth: '300px',
                  zIndex: 1000,
                  maxHeight: '400px',
                  overflow: 'auto',
                }}
              >
                {notifications.length === 0 ? (
                  <div style={{ padding: '16px', color: '#666', textAlign: 'center' }}>
                    No notifications
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid #eee',
                        cursor: 'pointer',
                      }}
                      onClick={() => {
                        setShowNotifDropdown(false);
                        if (notif.taskId) {
                          window.location.href = `/tasks/${notif.taskId}`;
                        }
                      }}
                    >
                      <p style={{ fontWeight: '500', marginBottom: '4px' }}>
                        {notif.details?.title || 'Notification'}
                      </p>
                      <p style={{ fontSize: '14px', color: '#666' }}>
                        {notif.details?.message}
                      </p>
                      <p style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                        {new Date(notif.createdAt).toLocaleString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
        <Link href="/api/auth/signout">Sign Out</Link>
      </nav>
    </header>
  );
}