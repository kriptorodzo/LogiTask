'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { emailApi, taskApi, userApi } from '@/lib/api';
import { Email, Task, User } from '@/types';
import PageShell from '@/components/PageShell';
import { useStatePersistence, useDebounce } from '@/lib/useStatePersistence';

type TabType = 'new' | 'pending' | 'delegated' | 'problematic' | 'overdue';

export default function ManagerInboxPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [emails, setEmails] = useState<Email[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [coordinators, setCoordinators] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  
  // State persistence
  const { loadState, saveState, clearState } = useStatePersistence('manager', {
    activeTab: 'pending',
    search: '',
  });

  // Restore state on mount (back navigation)
  useEffect(() => {
    try {
      const saved = loadState();
      if (saved.activeTab) setActiveTab(saved.activeTab as TabType);
      if (saved.search) setSearchQuery(saved.search);
    } catch (e) {
      console.warn('Failed to restore state:', e);
    }
  }, []);

  // Save state when it changes
  useEffect(() => {
    saveState({ activeTab, search: searchQuery });
  }, [activeTab, searchQuery]);

  // Clear state on unmount (only when leaving to non-detail pages)
  useEffect(() => {
    return () => {
      // Only clear if not navigating to a detail page
      // This prevents clearing state when going back from detail
    };
  }, []);

  const userRole = (session?.user as any)?.role;
  const isManager = userRole === 'MANAGER';

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/api/auth/signin');
    } else if (status === 'authenticated' && !isManager) {
      router.push('/');
    }
  }, [status, router, isManager]);

  useEffect(() => {
    if (session && isManager) {
      loadData();
    }
  }, [session, isManager]);

  async function loadData() {
    try {
      const [emailsData, tasksData, coordinatorsData] = await Promise.all([
        emailApi.getAll(),
        taskApi.getAll({}),
        userApi.getCoordinators(),
      ]);
      setEmails(emailsData);
      setAllTasks(tasksData);
      setCoordinators(coordinatorsData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }

  // Get tasks for a specific email
  function getTasksForEmail(emailId: string): Task[] {
    return allTasks.filter(t => (t as any).email?.id === emailId);
  }

  // Filter emails by tab
  function getFilteredEmails(): Email[] {
    switch (activeTab) {
      case 'new':
        return emails.filter(e => e.processingStatus === 'PENDING');
      case 'pending':
        return emails.filter(e => 
          e.processingStatus === 'PROCESSED' && 
          getTasksForEmail(e.id).some(t => t.status === 'PROPOSED')
        );
      case 'delegated':
        return emails.filter(e => 
          getTasksForEmail(e.id).some(t => t.status === 'IN_PROGRESS' || t.status === 'DONE')
        );
      case 'problematic':
        return emails.filter(e => e.requestType === 'UNCLASSIFIED');
      case 'overdue':
        return emails.filter(e => {
          const emailCase = (e as any).case;
          return emailCase && emailCase.caseDueAt && new Date(emailCase.caseDueAt) < new Date();
        });
      default:
        return emails;
    }
  }

  // Generate summary for email
  function getEmailSummary(email: Email): string {
    const parts: string[] = [];
    if (email.extractedLocation) parts.push(`Location: ${email.extractedLocation}`);
    if (email.extractedDeliveryDate) {
      const date = new Date(email.extractedDeliveryDate).toLocaleDateString();
      parts.push(`Due: ${date}`);
    }
    if (email.extractedSupplier) parts.push(`Supplier: ${email.extractedSupplier}`);
    if (email.extractedUrgency) parts.push(`Priority: ${email.extractedUrgency === 'HIGH' ? 'URGENT' : 'Normal'}`);
    return parts.join(' | ') || 'No data extracted';
  }

  // Get suggested delegation for tasks
  function getSuggestedDelegation(email: Email): { role: string; task: string }[] {
    const suggestions: { role: string; task: string }[] = [];
    const emailTasks = getTasksForEmail(email.id);
    
    const roleMap: Record<string, string> = {
      INBOUND_RECEIPT: 'RECEPTION_COORDINATOR',
      OUTBOUND_PREPARATION: 'DELIVERY_COORDINATOR',
      OUTBOUND_DELIVERY: 'DELIVERY_COORDINATOR',
      TRANSFER_DISTRIBUTION: 'DISTRIBUTION_COORDINATOR',
    };
    
    emailTasks.forEach(task => {
      const role = roleMap[task.requestType] || 'DELIVERY_COORDINATOR';
      const roleLabel = role === 'RECEPTION_COORDINATOR' ? 'Reception' : 
                        role === 'DELIVERY_COORDINATOR' ? 'Delivery' : 
                        role === 'DISTRIBUTION_COORDINATOR' ? 'Distribution' : role;
      suggestions.push({ role: roleLabel, task: task.title });
    });
    
    return suggestions;
  }

  async function handleApproveTask(taskId: string, assigneeId: string) {
    try {
      await taskApi.approve(taskId, assigneeId);
      loadData();
    } catch (error) {
      console.error('Failed to approve task:', error);
    }
  }

  async function handleRejectTask(taskId: string) {
    try {
      await taskApi.reject(taskId, 'Rejected by manager');
      loadData();
    } catch (error) {
      console.error('Failed to reject task:', error);
    }
  }

  async function handleApproveAll(emailId: string) {
    const emailTasks = getTasksForEmail(emailId).filter(t => t.status === 'PROPOSED');
    const defaultAssignee = coordinators[0];
    if (defaultAssignee) {
      for (const task of emailTasks) {
        await handleApproveTask(task.id, defaultAssignee.id);
      }
    }
  }

  function getStatusBadge(status: string): string {
    const badges: Record<string, string> = {
      PROPOSED: 'badge-proposed',
      APPROVED: 'badge-approved',
      IN_PROGRESS: 'badge-in-progress',
      DONE: 'badge-done',
      REJECTED: 'badge-rejected',
    };
    return badges[status] || '';
  }

  function getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      INBOUND_RECEIPT: 'Inbound',
      OUTBOUND_PREPARATION: 'Prep',
      OUTBOUND_DELIVERY: 'Delivery',
      TRANSFER_DISTRIBUTION: 'Distribution',
      UNCLASSIFIED: 'Unclassified',
    };
    return labels[type] || type;
  }

  if (loading) {
    return (
      <div className="container">
        <div className="empty-state">
          <h3>Loading...</h3>
        </div>
      </div>
    );
  }

  const filteredEmails = getFilteredEmails();
  
  const tabCounts = {
    new: emails.filter(e => e.processingStatus === 'PENDING').length,
    pending: emails.filter(e => e.processingStatus === 'PROCESSED' && getTasksForEmail(e.id).some(t => t.status === 'PROPOSED')).length,
    delegated: emails.filter(e => getTasksForEmail(e.id).some(t => t.status === 'IN_PROGRESS' || t.status === 'DONE')).length,
    problematic: emails.filter(e => e.requestType === 'UNCLASSIFIED').length,
    overdue: emails.filter(e => {
      const emailCase = (e as any).case;
      return emailCase && emailCase.caseDueAt && new Date(emailCase.caseDueAt) < new Date();
    }).length,
  };

  const tabLabels: Record<TabType, string> = {
    new: 'New',
    pending: 'Pending Approval',
    delegated: 'Delegated',
    problematic: 'Problematic',
    overdue: 'Overdue'
  };

  const tabIcons: Record<TabType, string> = {
    new: '🆕',
    pending: '⏳',
    delegated: '📤',
    problematic: '⚠️',
    overdue: '🔴'
  };

  return (
    <PageShell title="Manager Inbox" subtitle="Review and approve tasks">
      <div className="p-6">
        {/* Search */}
        <div style={{ marginBottom: '16px' }}>
          <input
            type="text"
            placeholder="Пребарувај email адреса, предмет, добавувач..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 16px',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              fontSize: '14px'
            }}
          />
        </div>
        
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
          {(['new', 'pending', 'delegated', 'problematic', 'overdue'] as TabType[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`btn ${activeTab === tab ? 'btn-primary' : 'btn-secondary'}`}
              style={{ position: 'relative' }}
            >
              {tabIcons[tab]} {tabLabels[tab]}
              <span style={{ 
                background: activeTab === tab ? 'white' : '#666',
                color: activeTab === tab ? '#0078d4' : 'white',
                borderRadius: '12px',
                padding: '2px 8px',
                fontSize: '12px',
                marginLeft: '8px'
              }}>
                {tabCounts[tab]}
              </span>
            </button>
          ))}
        </div>

        {/* Email Cards */}
        {filteredEmails.length === 0 ? (
          <div className="card empty-state">
            <h3>No emails in this category</h3>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {filteredEmails.map(email => {
              const emailTasks = getTasksForEmail(email.id);
              const delegation = getSuggestedDelegation(email);
              
              return (
                <div key={email.id} className="card" style={{ borderLeft: email.extractedUrgency === 'HIGH' ? '4px solid #d13438' : '4px solid #0078d4' }}>
                  {/* Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div>
                      <h3 style={{ margin: 0, color: '#0078d4' }}>{email.subject}</h3>
                      <p style={{ margin: '4px 0', color: '#666', fontSize: '14px' }}>
                        📧 {email.sender} • {new Date(email.receivedAt).toLocaleString()}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <span className={`badge ${email.requestType === 'UNCLASSIFIED' ? 'badge-rejected' : 'badge-approved'}`}>
                        {getTypeLabel(email.requestType || 'UNCLASSIFIED')}
                      </span>
                      {email.extractedUrgency === 'HIGH' && (
                        <span className="badge badge-proposed">URGENT</span>
                      )}
                    </div>
                  </div>

                  {/* System Summary */}
                  <div style={{ 
                    background: '#f0f0f0', 
                    padding: '12px', 
                    borderRadius: '8px', 
                    marginBottom: '16px',
                    fontSize: '14px'
                  }}>
                    <strong>📊 System Summary:</strong> {getEmailSummary(email)}
                  </div>

                  {/* Tasks Table */}
                  {emailTasks.length > 0 && (
                    <div style={{ marginBottom: '16px' }}>
                      <h4 style={{ marginBottom: '8px' }}>📋 Proposed Tasks ({emailTasks.length})</h4>
                      <table className="table" style={{ fontSize: '14px' }}>
                        <thead>
                          <tr>
                            <th>Task</th>
                            <th>Type</th>
                            <th>Due</th>
                            <th>Status</th>
                            <th>Assign To</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {emailTasks.map(task => (
                            <tr key={task.id}>
                              <td>{task.title}</td>
                              <td>{getTypeLabel(task.requestType)}</td>
                              <td>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '-'}</td>
                              <td>
                                <span className={`badge ${getStatusBadge(task.status)}`}>
                                  {task.status === 'PROPOSED' ? 'Proposed' : 
                                   task.status === 'APPROVED' ? 'Approved' :
                                   task.status === 'IN_PROGRESS' ? 'In Progress' : 
                                   task.status === 'DONE' ? 'Done' : task.status}
                                </span>
                              </td>
                              <td>
                                {task.status === 'PROPOSED' ? (
                                  <select
                                    onChange={(e) => {
                                      if (e.target.value) {
                                        handleApproveTask(task.id, e.target.value);
                                        e.target.value = '';
                                      }
                                    }}
                                    style={{ padding: '4px', fontSize: '12px' }}
                                  >
                                    <option value="">Select...</option>
                                    {coordinators.map(c => (
                                      <option key={c.id} value={c.id}>
                                        {c.displayName || c.email}
                                      </option>
                                    ))}
                                  </select>
                                ) : (
                                  (task as any).assignee?.displayName || '-'
                                )}
                              </td>
                              <td>
                                {task.status === 'PROPOSED' && (
                                  <button
                                    onClick={() => handleRejectTask(task.id)}
                                    style={{ 
                                      background: 'none', 
                                      border: 'none', 
                                      color: '#d13438', 
                                      cursor: 'pointer',
                                      fontSize: '12px'
                                    }}
                                  >
                                    ❌
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Delegation Suggestions */}
                  {delegation.length > 0 && emailTasks.some(t => t.status === 'PROPOSED') && (
                    <div style={{ 
                      background: '#e6f7ff', 
                      padding: '12px', 
                      borderRadius: '8px',
                      marginBottom: '16px'
                    }}>
                      <strong>💡 Suggested Delegation:</strong>
                      <div style={{ display: 'flex', gap: '16px', marginTop: '8px', flexWrap: 'wrap' }}>
                        {delegation.map((d, i) => (
                          <div key={i} style={{ 
                            background: 'white', 
                            padding: '8px 12px', 
                            borderRadius: '4px',
                            fontSize: '13px'
                          }}>
                            <strong>{d.role}:</strong> {d.task}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    {emailTasks.some(t => t.status === 'PROPOSED') && (
                      <button
                        className="btn btn-primary"
                        onClick={() => handleApproveAll(email.id)}
                      >
                        ✅ Approve All
                      </button>
                    )}
                    <button
                      className="btn btn-secondary"
                      onClick={() => router.push(`/emails/${email.id}`)}
                    >
                      📝 Details
                    </button>
                    {email.requestType === 'UNCLASSIFIED' && (
                      <button
                        className="btn btn-secondary"
                        style={{ background: '#d13438', color: 'white' }}
                      >
                        ⚠️ Classify
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PageShell>
  );
}