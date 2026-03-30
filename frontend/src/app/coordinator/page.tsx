'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { inboundApi, taskApi } from '@/lib/api';
import PageShell from '@/components/PageShell';
import { useStatePersistence, useDebounce } from '@/lib/useStatePersistence';

type Tab = 'my' | 'today' | 'in_progress' | 'done' | 'overdue';
type FilterType = 'all' | 'INBOUND_RECEIPT' | 'OUTBOUND_PREPARATION' | 'OUTBOUND_DELIVERY' | 'TRANSFER_DISTRIBUTION';

const REQUEST_TYPE_LABELS: Record<string, string> = {
  INBOUND_RECEIPT: 'Прием',
  OUTBOUND_PREPARATION: 'Подготовка',
  OUTBOUND_DELIVERY: 'Испорака',
  TRANSFER_DISTRIBUTION: 'Дистрибуција',
};

// Role to task type mapping for auto-filtering
const ROLE_DEFAULT_FILTER: Record<string, FilterType> = {
  RECEPTION_COORDINATOR: 'INBOUND_RECEIPT',
  DELIVERY_COORDINATOR: 'OUTBOUND_DELIVERY',
  DISTRIBUTION_COORDINATOR: 'TRANSFER_DISTRIBUTION',
};

export default function CoordinatorPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tasks, setTasks] = useState<any[]>([]);
  const [allTasks, setAllTasks] = useState<any[]>([]); // Store all for filtering
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('my');
  const [typeFilter, setTypeFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  
  // Get user role
  const userRole = (session?.user as any)?.role || 'RECEPTION_COORDINATOR';
  const userId = session?.user?.email;
  
  // Get default filter for role
  const getDefaultFilter = (): FilterType => {
    return ROLE_DEFAULT_FILTER[userRole] || 'all';
  };
  
  // State persistence
  const { loadState, saveState } = useStatePersistence('coordinator', {
    activeTab: 'my',
    typeFilter: getDefaultFilter(),
    search: '',
  });

  useEffect(() => {
    const saved = loadState();
    if (saved.activeTab) setActiveTab(saved.activeTab as Tab);
    // Apply role-based default filter
    const defaultFilter = getDefaultFilter();
    if (saved.typeFilter && saved.typeFilter !== 'all' && saved.typeFilter !== defaultFilter) {
      setTypeFilter(saved.typeFilter as FilterType);
    } else {
      setTypeFilter(defaultFilter);
    }
    if (saved.search) setSearchQuery(saved.search);
  }, []);

  useEffect(() => {
    saveState({ activeTab, typeFilter, search: searchQuery });
  }, [activeTab, typeFilter, searchQuery]);

  const [updating, setUpdating] = useState<string | null>(null);
  const [toast, setToast] = useState<{message: string; type: 'success' | 'error'} | null>(null);

  // Toast helper
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/api/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    if (session && userId) {
      loadData();
    }
  }, [session, userId]);

  async function loadData() {
    setLoading(true);
    try {
      // NEW: Use inbound API for coordinator workboard
      const data = await inboundApi.getCoordinatorSummary(userId);
      const coordinatorTasks = data.myTasks || [];
      setAllTasks(coordinatorTasks);
      filterTasks(coordinatorTasks, activeTab, typeFilter);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadAllTasks() {
    // Use loadData instead - it's already using inbound API
    await loadData();
  }

  function filterTasks(tasksToFilter: any[], tab: Tab, filter: FilterType) {
    let filtered = tasksToFilter;
    
    // Filter by tab
    switch (tab) {
      case 'my':
        filtered = filtered.filter(t => t.status === 'APPROVED' || t.status === 'IN_PROGRESS');
        break;
      case 'today':
        const today = new Date().toISOString().split('T')[0];
        filtered = filtered.filter(t => {
          if (!t.dueDate) return false;
          return t.dueDate.split('T')[0] === today;
        });
        break;
      case 'in_progress':
        filtered = filtered.filter(t => t.status === 'IN_PROGRESS');
        break;
      case 'done':
        filtered = filtered.filter(t => t.status === 'DONE');
        break;
      case 'overdue':
        filtered = filtered.filter(t => {
          if (t.status === 'DONE') return false;
          if (!t.dueDate) return false;
          return new Date(t.dueDate) < new Date();
        });
        break;
    }
    
    // Filter by type
    if (filter !== 'all') {
      filtered = filtered.filter(t => t.requestType === filter);
    }
    
    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t => 
        t.title.toLowerCase().includes(query) ||
        t.description?.toLowerCase().includes(query)
      );
    }
    
    setTasks(filtered);
  }

  useEffect(() => {
    filterTasks(allTasks, activeTab, typeFilter);
  }, [activeTab, typeFilter, searchQuery, allTasks]);

  async function handleStatusChange(taskId: string, newStatus: string) {
    setUpdating(taskId);
    try {
      await taskApi.updateStatus(taskId, newStatus);
      await loadAllTasks();
      showToast(newStatus === 'IN_PROGRESS' ? '▶️ Започната задача' : '✅ Завршена задача');
    } catch (error) {
      console.error('Failed to update task:', error);
      showToast('Грешка при ажурирање', 'error');
    } finally {
      setUpdating(null);
    }
  }

  async function handleStartTask(taskId: string) {
    await handleStatusChange(taskId, 'IN_PROGRESS');
  }

  async function handleCompleteTask(taskId: string) {
    await handleStatusChange(taskId, 'DONE');
  }

  const getTabLabel = (tab: Tab) => {
    const labels: Record<Tab, string> = {
      my: 'Мои задачи',
      today: 'Денешни',
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
    };
    return labels[status] || status;
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      INBOUND_RECEIPT: '#3b82f6', // blue
      OUTBOUND_PREPARATION: '#f59e0b', // amber
      OUTBOUND_DELIVERY: '#10b981', // green
      TRANSFER_DISTRIBUTION: '#8b5cf6', // purple
    };
    return colors[type] || '#6b7280';
  };

  const isOverdue = (task: Task) => {
    if (task.status === 'DONE') return false;
    if (!task.dueDate) return false;
    return new Date(task.dueDate) < new Date();
  };

  if (status === 'loading' || loading) {
    return (
      <PageShell title="Workboard" subtitle="Loading...">
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p>Вчитување...</p>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell title="My Workboard" subtitle={`Работна табла за ${userRole.replace('_', ' ')}`}>
      <div className="p-6">
        {/* Toast Notification */}
        {toast && (
          <div style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '16px 24px',
            background: toast.type === 'success' ? '#10b981' : '#ef4444',
            color: 'white',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 1000,
            fontWeight: '500',
          }}>
            {toast.message}
          </div>
        )}
        {/* Filters Row */}
        <div style={{ 
          display: 'flex', 
          gap: '16px', 
          marginBottom: '20px',
          padding: '16px',
          background: '#f9fafb',
          borderRadius: '8px',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          {/* Type Filter - only filter, no search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
            <label style={{ fontSize: '14px', color: '#6b7280', whiteSpace: 'nowrap' }}>Филтрирај:</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as FilterType)}
              style={{
                padding: '10px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                background: 'white',
                minWidth: '180px',
              }}
            >
              <option value={getDefaultFilter()}>Мои задачи</option>
              <option value="all">Сите типови</option>
              <option value="INBOUND_RECEIPT">Прием</option>
              <option value="OUTBOUND_PREPARATION">Подготовка</option>
              <option value="OUTBOUND_DELIVERY">Испорака</option>
              <option value="TRANSFER_DISTRIBUTION">Дистрибуција</option>
            </select>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ 
          display: 'flex', 
          gap: '8px', 
          marginBottom: '20px', 
          borderBottom: '1px solid #e5e7eb', 
          paddingBottom: '12px' 
        }}>
          {(['my', 'today', 'in_progress', 'overdue', 'done'] as Tab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '8px 16px',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: activeTab === tab ? '600' : '400',
                backgroundColor: activeTab === tab ? '#3b82f6' : '#f3f4f6',
                color: activeTab === tab ? 'white' : '#374151',
                fontSize: '14px',
              }}
            >
              {getTabLabel(tab)} 
              <span style={{ marginLeft: '6px', opacity: 0.7 }}>
                ({tab === 'my' ? allTasks.filter(t => t.status === 'APPROVED' || t.status === 'IN_PROGRESS').length :
                  tab === 'today' ? allTasks.filter(t => {
                    const today = new Date().toISOString().split('T')[0];
                    return t.dueDate?.split('T')[0] === today;
                  }).length :
                  tab === 'in_progress' ? allTasks.filter(t => t.status === 'IN_PROGRESS').length :
                  tab === 'overdue' ? allTasks.filter(t => isOverdue(t)).length :
                  allTasks.filter(t => t.status === 'DONE').length
                })
              </span>
            </button>
          ))}
        </div>

        {/* Task Cards Grid */}
        {tasks.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '60px', 
            backgroundColor: '#f9fafb', 
            borderRadius: '12px',
            border: '2px dashed #e5e7eb'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
            <p style={{ color: '#6b7280', fontSize: '16px' }}>Нема задачи во оваа категорија</p>
            <p style={{ color: '#9ca3af', fontSize: '14px', marginTop: '8px' }}>
              {activeTab === 'my' ? 'Немате одобрени задачи' : 
               activeTab === 'today' ? 'Немате задачи за денес' :
               activeTab === 'overdue' ? 'Немате задоцнети задачи' :
               activeTab === 'done' ? 'Немате завршени задачи' : 'Немате задачи во тек'}
            </p>
          </div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', 
            gap: '20px' 
          }}>
            {tasks.map(task => (
              <div
                key={task.id}
                style={{
                  padding: '24px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '16px',
                  backgroundColor: 'white',
                  borderLeft: `6px solid ${getTypeColor(task.requestType)}`,
                  boxShadow: isOverdue(task) ? '0 0 0 2px #ef4444, 0 4px 6px rgba(0,0,0,0.1)' : '0 2px 4px rgba(0,0,0,0.1)',
                }}
              >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      display: 'inline-block',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: '600',
                      backgroundColor: getTypeColor(task.requestType) + '20',
                      color: getTypeColor(task.requestType),
                      marginBottom: '8px',
                    }}>
                      {REQUEST_TYPE_LABELS[task.requestType] || task.requestType}
                    </div>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>
                      {task.title}
                    </h3>
                  </div>
                  <span className={`badge ${getStatusBadgeClass(task.status)}`}>
                    {getStatusLabel(task.status)}
                  </span>
                </div>

                {/* Description */}
                {task.description && (
                  <p style={{ margin: '0 0 12px', color: '#6b7280', fontSize: '14px', lineHeight: '1.5' }}>
                    {task.description.length > 100 ? task.description.substring(0, 100) + '...' : task.description}
                  </p>
                )}

                {/* Meta info */}
                <div style={{ 
                  display: 'flex', 
                  gap: '16px', 
                  marginBottom: '16px',
                  fontSize: '13px',
                  color: '#9ca3af'
                }}>
                  {task.dueDate && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span>📅</span>
                      <span style={{ 
                        color: isOverdue(task) ? '#ef4444' : '#6b7280',
                        fontWeight: isOverdue(task) ? '600' : '400'
                      }}>
                        {new Date(task.dueDate).toLocaleDateString('mk-MK')}
                        {isOverdue(task) && ' (Доцни!)'}
                      </span>
                    </div>
                  )}
                  {task.erpDocumentId && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span>📦</span>
                      <span>ERP</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  {task.status === 'APPROVED' && (
                    <button
                      onClick={() => handleStartTask(task.id)}
                      disabled={updating === task.id}
                      style={{
                        flex: 1,
                        padding: '14px 24px',
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: updating === task.id ? 'not-allowed' : 'pointer',
                        fontWeight: '600',
                        fontSize: '15px',
                      }}
                    >
                      {updating === task.id ? 'Се активира...' : '▶️ Почни'}
                    </button>
                  )}
                  
                  {task.status === 'IN_PROGRESS' && (
                    <button
                      onClick={() => handleCompleteTask(task.id)}
                      disabled={updating === task.id}
                      style={{
                        flex: 1,
                        padding: '14px 24px',
                        backgroundColor: '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: updating === task.id ? 'not-allowed' : 'pointer',
                        fontWeight: '600',
                        fontSize: '15px',
                      }}
                    >
                      {updating === task.id ? 'Се завршува...' : '✅ Заврши'}
                    </button>
                  )}
                  
                  {task.status === 'DONE' && (
                    <div style={{
                      flex: 1,
                      padding: '14px 24px',
                      backgroundColor: '#f3f4f6',
                      color: '#6b7280',
                      borderRadius: '8px',
                      textAlign: 'center',
                      fontSize: '14px',
                      fontWeight: '500',
                    }}>
                      ✓ Завршена
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}