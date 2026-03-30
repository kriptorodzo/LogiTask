'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { emailApi, taskApi, userApi } from '@/lib/api';
import { Email, Task, User } from '@/types';
import PageShell from '@/components/PageShell';
import DelegationModal from '@/components/DelegationModal';
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
  
  // Delegation modal state
  const [delegationModal, setDelegationModal] = useState<{
    isOpen: boolean;
    emailId: string;
    emailSubject: string;
    taskCount: number;
    suggestedRole: string | undefined;
  }>({
    isOpen: false,
    emailId: '',
    emailSubject: '',
    taskCount: 0,
    suggestedRole: undefined,
  });
  
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
    const email = emails.find(e => e.id === emailId);
    
    if (emailTasks.length === 0) {
      return; // No tasks to approve
    }
    
    // Determine suggested role based on task types
    const taskTypes = [...new Set(emailTasks.map(t => t.requestType))];
    const roleMap: Record<string, string> = {
      INBOUND_RECEIPT: 'RECEPTION_COORDINATOR',
      OUTBOUND_PREPARATION: 'DELIVERY_COORDINATOR',
      OUTBOUND_DELIVERY: 'DELIVERY_COORDINATOR',
      TRANSFER_DISTRIBUTION: 'DISTRIBUTION_COORDINATOR',
    };
    const suggestedRole = roleMap[taskTypes[0]] || 'DELIVERY_COORDINATOR';
    
    // Open delegation modal instead of auto-assigning
    setDelegationModal({
      isOpen: true,
      emailId,
      emailSubject: email?.subject || '',
      taskCount: emailTasks.length,
      suggestedRole,
    });
  }
  
  // Handle actual delegation with selected assignee
  async function handleDelegationWithAssignee(assigneeId: string) {
    const emailTasks = getTasksForEmail(delegationModal.emailId).filter(t => t.status === 'PROPOSED');
    
    // Approve each task with the selected assignee
    for (const task of emailTasks) {
      await handleApproveTask(task.id, assigneeId);
    }
    
    // Refresh data
    loadData();
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
    pending: 'Needs Action',
    delegated: 'Active',
    problematic: 'Problematic',
    overdue: 'Overdue'
  };

  const tabIcons: Record<TabType, string> = {
    new: '🆕',
    pending: '⚡',
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

                  {/* Tasks Summary - SIMPLIFIED */}
                  {emailTasks.length > 0 && (
                    <div style={{ 
                      marginBottom: '16px', 
                      padding: '12px', 
                      background: '#f9fafb', 
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>
                          📋 Tasks ({emailTasks.length})
                        </h4>
                        {/* Quick status pills */}
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {emailTasks.filter(t => t.status === 'PROPOSED').length > 0 && (
                            <span style={{ 
                              background: '#fef3c7', 
                              color: '#92400e', 
                              padding: '2px 8px', 
                              borderRadius: '12px', 
                              fontSize: '12px' 
                            }}>
                              {emailTasks.filter(t => t.status === 'PROPOSED').length} Pending
                            </span>
                          )}
                          {emailTasks.filter(t => t.status === 'IN_PROGRESS').length > 0 && (
                            <span style={{ 
                              background: '#dbeafe', 
                              color: '#1e40af', 
                              padding: '2px 8px', 
                              borderRadius: '12px', 
                              fontSize: '12px' 
                            }}>
                              {emailTasks.filter(t => t.status === 'IN_PROGRESS').length} In Progress
                            </span>
                          )}
                          {emailTasks.filter(t => t.status === 'DONE').length > 0 && (
                            <span style={{ 
                              background: '#d1fae5', 
                              color: '#065f46', 
                              padding: '2px 8px', 
                              borderRadius: '12px', 
                              fontSize: '12px' 
                            }}>
                              {emailTasks.filter(t => t.status === 'DONE').length} Done
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Task types summary */}
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {[...new Set(emailTasks.map(t => t.requestType))].map(type => (
                          <span key={type} style={{ 
                            background: '#e5e7eb', 
                            padding: '4px 8px', 
                            borderRadius: '4px', 
                            fontSize: '12px',
                            color: '#374151'
                          }}>
                            {getTypeLabel(type)}
                          </span>
                        ))}
                      </div>
                      
                      {/* If all proposed, show approve all button */}
                      {emailTasks.every(t => t.status === 'PROPOSED') && emailTasks.length > 0 && (
                        <div style={{ marginTop: '12px' }}>
                          <button
                            className="btn btn-primary"
                            onClick={() => handleApproveAll(email.id)}
                            style={{ fontSize: '13px', padding: '8px 16px' }}
                          >
                            ✅ Approve All ({emailTasks.length} tasks)
                          </button>
                        </div>
                      )}
                      
                      {/* If mixed status, show partial info */}
                      {emailTasks.some(t => t.status !== 'PROPOSED') && emailTasks.length > 0 && (
                        <div style={{ marginTop: '12px', fontSize: '13px', color: '#666' }}>
                          💡 {emailTasks.filter(t => t.status === 'PROPOSED').length} task(s) pending approval
                        </div>
                      )}
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
      
      {/* Delegation Modal */}
      <DelegationModal
        isOpen={delegationModal.isOpen}
        onClose={() => setDelegationModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={handleDelegationWithAssignee}
        coordinators={coordinators}
        emailSubject={delegationModal.emailSubject}
        taskCount={delegationModal.taskCount}
        suggestedRole={delegationModal.suggestedRole}
      />
    </PageShell>
  );
}