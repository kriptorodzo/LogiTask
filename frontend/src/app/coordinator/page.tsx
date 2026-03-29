'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { taskApi } from '@/lib/api';
import { Task, TASK_STATUS } from '@/types';
import TopBar from '@/components/TopBar';

type Tab = 'my' | 'in_progress' | 'done' | 'overdue';

export default function CoordinatorPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('my');
  const [updating, setUpdating] = useState<string | null>(null);

  const userRole = (session?.user as any)?.role || 'RECEPTION_COORDINATOR';
  const isManager = userRole === 'MANAGER';

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/api/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      loadTasks();
    }
  }, [session, activeTab]);

  async function loadTasks() {
    setLoading(true);
    try {
      let tasksData: Task[] = [];
      
      switch (activeTab) {
        case 'my':
          tasksData = await taskApi.getMyTasks();
          break;
        case 'in_progress':
          tasksData = await taskApi.getAll({ status: 'IN_PROGRESS' });
          break;
        case 'done':
          tasksData = await taskApi.getAll({ status: 'DONE' });
          break;
        case 'overdue':
          const all = await taskApi.getAll({});
          tasksData = all.filter((t: Task) => {
            if (t.status === 'DONE') return false;
            return t.dueDate && new Date(t.dueDate) < new Date();
          });
          break;
      }
      
      setTasks(tasksData);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(taskId: string, newStatus: string) {
    setUpdating(taskId);
    try {
      await taskApi.updateStatus(taskId, newStatus);
      await loadTasks();
    } catch (error) {
      console.error('Failed to update task:', error);
    } finally {
      setUpdating(null);
    }
  }

  async function handleComplete(taskId: string) {
    setUpdating(taskId);
    try {
      await taskApi.updateStatus(taskId, 'DONE');
      await loadTasks();
    } catch (error) {
      console.error('Failed to complete task:', error);
    } finally {
      setUpdating(null);
    }
  }

  const getTabLabel = (tab: Tab) => {
    const labels: Record<Tab, string> = {
      my: 'Мои задачи',
      in_progress: 'Во тек',
      done: 'Завршени',
      overdue: 'Доцне'
    };
    return labels[tab];
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'PROPOSED': return 'badge-proposed';
      case 'APPROVED': return 'badge-approved';
      case 'IN_PROGRESS': return 'badge-in-progress';
      case 'DONE': return 'badge-done';
      case 'REJECTED': return 'badge-rejected';
      default: return '';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      PROPOSED: 'Предложена',
      APPROVED: 'Одобрена',
      IN_PROGRESS: 'Во тек',
      DONE: 'Завршена',
      REJECTED: 'Одбиена',
      CANCELLED: 'Откажана'
    };
    return labels[status] || status;
  };

  if (status === 'loading' || loading) {
    return (
      <div className="container">
        <Header />
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p>Вчитување...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <TopBar 
        title="Coordinator Board"
        subtitle={`Your role: ${userRole}`}
        breadcrumbs={[
          { label: 'Coordinator Board' }
        ]}
      />
      <div className="page-content">
        <div style={{ marginBottom: '20px' }}>
          <h2>Координаторска табла</h2>
          <p style={{ color: '#666' }}>
            Улога: <strong>{userRole}</strong>
          </p>
        </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid #ddd', paddingBottom: '12px' }}>
        {(['my', 'in_progress', 'done', 'overdue'] as Tab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: activeTab === tab ? 'bold' : 'normal',
              backgroundColor: activeTab === tab ? '#0070f3' : '#f0f0f0',
              color: activeTab === tab ? 'white' : '#333'
            }}
          >
            {getTabLabel(tab)} ({tasks.length})
          </button>
        ))}
      </div>

      {/* Task List */}
      {tasks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
          <p style={{ color: '#666' }}>Нема задачи во оваа категорија</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {tasks.map(task => (
            <div
              key={task.id}
              style={{
                padding: '16px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                backgroundColor: 'white'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div>
                  <h3 style={{ margin: 0, marginBottom: '4px' }}>{task.title}</h3>
                  <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
                    {task.requestType}
                    {/* Show ERP source badge */}
                    {(task.requestType?.startsWith('ERP_') || task.erpDocumentId) && (
                      <span style={{
                        marginLeft: '8px',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        background: '#e3f2fd',
                        color: '#1565c0',
                      }}>
                        ERP
                      </span>
                    )}
                    {task.dueDate && (
                      <span> • До: {new Date(task.dueDate).toLocaleDateString()}</span>
                    )}
                  </p>
                </div>
                <span className={`badge ${getStatusBadgeClass(task.status)}`}>
                  {getStatusLabel(task.status)}
                </span>
              </div>

              {task.description && (
                <p style={{ margin: '8px 0', color: '#555' }}>{task.description}</p>
              )}

              {/* Show ERP document details if available */}
              {task.erpDocumentId && (
                <div style={{
                  marginTop: '8px',
                  padding: '8px 12px',
                  background: '#f5f5f5',
                  borderRadius: '4px',
                  fontSize: '13px',
                  color: '#666'
                }}>
                  <span style={{ fontFamily: 'monospace' }}># ERP документ</span>
                </div>
              )}

              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                {task.status === 'PROPOSED' && (
                  <button
                    onClick={() => handleStatusChange(task.id, 'IN_PROGRESS')}
                    disabled={updating === task.id}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#0070f3',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    {updating === task.id ? 'Се ажурира...' : 'Почни'}
                  </button>
                )}
                
                {task.status === 'IN_PROGRESS' && (
                  <button
                    onClick={() => handleComplete(task.id)}
                    disabled={updating === task.id}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#2e7d32',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    {updating === task.id ? 'Се ажурира...' : 'Заврши'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </>
  );
}