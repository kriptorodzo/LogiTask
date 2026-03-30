'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { emailApi, taskApi, userApi } from '@/lib/api';
import { Email, Task, User } from '@/types';
import PageShell from '@/components/PageShell';
import BackButton from '@/components/BackButton';

// Human-readable task type labels
const TASK_TYPE_LABELS: Record<string, string> = {
  OUTBOUND_PREPARATION: 'Подготовка',
  OUTBOUND_DELIVERY: 'Испорака',
  INBOUND_RECEIPT: 'Прием',
  TRANSFER_DISTRIBUTION: 'Дистрибуција',
  UNCLASSIFIED: 'Некатегоризирано',
};

// Role labels for assignment display
const ROLE_LABELS: Record<string, string> = {
  RECEPTION_COORDINATOR: 'Reception Coordinator',
  DELIVERY_COORDINATOR: 'Delivery Coordinator',
  DISTRIBUTION_COORDINATOR: 'Distribution Coordinator',
};

function getTaskTypeLabel(type: string | null | undefined): string {
  if (!type) return 'Непознат тип';
  return TASK_TYPE_LABELS[type] || type;
}

function getRoleLabel(role: string | undefined): string {
  if (!role) return 'Непознат';
  return ROLE_LABELS[role] || role;
}

// Get appropriate coordinator based on task type
function getCoordinatorForTaskType(coordinators: User[], requestType: string | null): User | undefined {
  if (!requestType || coordinators.length === 0) {
    // Fallback: find any delivery coordinator
    return coordinators.find(c => c.role === 'DELIVERY_COORDINATOR') || coordinators[0];
  }
  
  const roleMap: Record<string, string> = {
    INBOUND_RECEIPT: 'RECEPTION_COORDINATOR',
    OUTBOUND_PREPARATION: 'DELIVERY_COORDINATOR',
    OUTBOUND_DELIVERY: 'DISTRIBUTION_COORDINATOR',
    TRANSFER_DISTRIBUTION: 'DISTRIBUTION_COORDINATOR',
  };
  
  const requiredRole = roleMap[requestType];
  if (requiredRole) {
    // Explicitly find coordinator by role
    const found = coordinators.find(c => c.role === requiredRole);
    if (found) return found;
    // Fallback: find any coordinator with matching role keyword
    const fallback = coordinators.find(c => 
      c.role?.toLowerCase().includes(requiredRole.split('_')[0].toLowerCase())
    );
    if (fallback) return fallback;
  }
  
  // Final fallback: find any delivery coordinator
  const deliveryCoordinator = coordinators.find(c => c.role === 'DELIVERY_COORDINATOR');
  return deliveryCoordinator || coordinators[0];
}

// Get coordinator by role
function getCoordinatorByRole(coordinators: User[], role: string): User | undefined {
  return coordinators.find(c => c.role === role) || coordinators[0];
}

export default function EmailDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const [email, setEmail] = useState<Email | null>(null);
  const [loading, setLoading] = useState(true);
  const [coordinators, setCoordinators] = useState<User[]>([]);
  const [actionLoading, setActionLoading] = useState(false);

  const userRole = (session?.user as any)?.role;
  const isManager = userRole === 'MANAGER';

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/api/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    if (session && params.id) {
      loadEmail();
      if (isManager) {
        loadCoordinators();
      }
    }
  }, [session, params.id, isManager]);

  async function loadEmail() {
    try {
      const data = await emailApi.getById(params.id as string);
      setEmail(data);
    } catch (error) {
      console.error('Failed to load email:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadCoordinators() {
    try {
      const data = await userApi.getCoordinators();
      setCoordinators(data);
    } catch (error) {
      console.error('Failed to load coordinators:', error);
    }
  }

  async function handleApproveAll(selectedCoordinatorId?: string) {
    if (!email?.tasks?.length || coordinators.length === 0) return;
    
    setActionLoading(true);
    try {
      // First, assign all tasks with appropriate coordinator based on task type
      const approvalPromises = email.tasks
        .filter(task => task.status === 'PROPOSED')
        .map(async (task) => {
          // Use task-specific coordinator based on requestType
          const coordinator = getCoordinatorForTaskType(coordinators, task.requestType);
          // If user selected a specific coordinator from dropdown, use that for all tasks
          const assigneeId = selectedCoordinatorId || coordinator?.id;
          if (assigneeId) {
            await taskApi.approve(task.id, assigneeId);
          }
        });
      
      await Promise.all(approvalPromises);
      await loadEmail(); // Refresh
    } catch (error) {
      console.error('Failed to approve tasks:', error);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReject() {
    if (!email) return;
    
    setActionLoading(true);
    try {
      await emailApi.updateStatus(email.id, 'REJECTED');
      router.push('/manager');
    } catch (error) {
      console.error('Failed to reject email:', error);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleClassify(requestType: string) {
    if (!email) return;
    
    setActionLoading(true);
    try {
      await emailApi.classify(email.id, requestType);
      await loadEmail();
    } catch (error) {
      console.error('Failed to classify email:', error);
    } finally {
      setActionLoading(false);
    }
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

  if (!email) {
    return (
      <div className="container">
        <div className="empty-state">
          <h3>Email not found</h3>
        </div>
      </div>
    );
  }

  const isUnclassified = email.requestType === 'UNCLASSIFIED';
  const hasProposedTasks = email.tasks?.some(t => t.status === 'PROPOSED') || false;
  const hasApprovedTasks = email.tasks?.some(t => t.status === 'APPROVED') || false;
  const hasAnyTasks = email.tasks && email.tasks.length > 0;

  return (
    <PageShell title="Email Details" subtitle={email?.subject || 'Loading...'} showBack backHref="/reports">
      <div className="p-6">
        {/* Action Buttons for Manager */}
        {isManager && (
          <div style={{ marginBottom: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            
            {isUnclassified && (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ marginRight: '8px' }}>Класифицирај како:</span>
                {['INBOUND_RECEIPT', 'OUTBOUND_PREPARATION', 'OUTBOUND_DELIVERY', 'TRANSFER_DISTRIBUTION'].map(type => (
                  <button
                    key={type}
                    onClick={() => handleClassify(type)}
                    disabled={actionLoading}
                    style={{
                      padding: '8px 12px',
                      background: '#f59e0b',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                  >
                    {getTaskTypeLabel(type)}
                  </button>
                ))}
              </div>
            )}
            
            {!isUnclassified && hasProposedTasks && (
              <>
                <select 
                  id="assignee-select"
                  style={{ padding: '8px', borderRadius: '4px', minWidth: '200px' }}
                >
                  <option value="">Избери координатор...</option>
                  {coordinators.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.displayName || c.email}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => {
                    const select = document.getElementById('assignee-select') as HTMLSelectElement;
                    handleApproveAll(select.value || undefined);
                  }}
                  disabled={actionLoading}
                  style={{
                    padding: '8px 16px',
                    background: '#22c55e',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  {actionLoading ? 'Се одобрува...' : '✓ Одобри ги сите'}
                </button>
                <button
                  onClick={handleReject}
                  disabled={actionLoading}
                  style={{
                    padding: '8px 16px',
                    background: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  ✗ Одбиј
                </button>
              </>
            )}
          </div>
        )}

        {/* Email Header Card */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <h2 style={{ margin: 0 }}>{email.subject}</h2>
            {email.extractedUrgency === 'HIGH' && (
              <span style={{ 
                background: '#ef4444', 
                color: 'white', 
                padding: '4px 12px', 
                borderRadius: '4px',
                fontWeight: 'bold'
              }}>
                🚨 HIGH
              </span>
            )}
          </div>
          
          <div className="grid grid-2" style={{ marginBottom: '16px' }}>
            <div>
              <p><strong>Од:</strong> {email.sender}</p>
              <p><strong>Email:</strong> {email.senderEmail}</p>
            </div>
            <div>
              <p><strong>Применето:</strong> {new Date(email.receivedAt).toLocaleString('mk-MK')}</p>
              <p>
                <strong>Статус:</strong> 
                <span className={`badge ${email.processingStatus === 'PROCESSED' ? 'badge-approved' : 'badge-proposed'}`}>
                  {email.processingStatus === 'PROCESSED' ? 'Обработено' : 'На чекање'}
                </span>
              </p>
            </div>
          </div>

          {/* Classification Type */}
          <div className="form-group">
            <label>Класификација</label>
            {isUnclassified ? (
              <span style={{ 
                background: '#f59e0b', 
                color: 'white', 
                padding: '4px 12px', 
                borderRadius: '4px',
                fontWeight: 'bold'
              }}>
                ⚠️ НЕКАТЕГОРИЗИРАНО
              </span>
            ) : (
              <span className="badge badge-approved" style={{ fontSize: '14px' }}>
                {getTaskTypeLabel(email.requestType)}
              </span>
            )}
          </div>

          {/* Case Status */}
          {(email as any).case && (
            <div className="form-group" style={{ marginTop: '16px' }}>
              <label>Status на Case</label>
              {(() => {
                const caseData = (email as any).case;
                const statusConfig: Record<string, { label: string; className: string; bgColor: string }> = {
                  NEW: { label: 'Нов', className: 'badge-proposed', bgColor: '#6b7280' },
                  PROPOSED: { label: 'Предложен', className: 'badge-proposed', bgColor: '#f59e0b' },
                  APPROVED: { label: 'Одобрен', className: 'badge-approved', bgColor: '#3b82f6' },
                  IN_PROGRESS: { label: 'Во тек', className: 'badge-in-progress', bgColor: '#8b5cf6' },
                  DONE: { label: 'Завршен', className: 'badge-done', bgColor: '#10b981' },
                  PARTIAL: { label: 'Делумно', className: 'badge-in-progress', bgColor: '#f97316' },
                  FAILED: { label: 'Неуспешен', className: 'badge-rejected', bgColor: '#ef4444' },
                  CANCELLED: { label: 'Откажан', className: 'badge-rejected', bgColor: '#6b7280' },
                };
                const config = statusConfig[caseData.caseStatus] || statusConfig.NEW;
                return (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <span 
                      className={`badge ${config.className}`}
                      style={{ 
                        fontSize: '14px', 
                        padding: '6px 12px',
                        background: config.bgColor,
                        fontWeight: 'bold'
                      }}
                    >
                      {config.label}
                    </span>
                    {caseData.isOtif !== null && caseData.isOtif !== undefined && (
                      <span style={{ 
                        background: caseData.isOtif ? '#10b981' : '#ef4444', 
                        color: 'white', 
                        padding: '4px 8px', 
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}>
                        OTIF: {caseData.isOtif ? '✅' : '❌'}
                      </span>
                    )}
                    <span style={{ fontSize: '13px', color: '#666' }}>
                      Задачи: {caseData.completedTasks || 0}/{caseData.totalTasks || 0}
                    </span>
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        {/* Extracted Information with Warnings */}
        <div className="card">
          <h3 style={{ marginBottom: '16px' }}>📋 Извлечени информации</h3>
          <div className="grid grid-2">
            <div style={{ 
              padding: '12px', 
              background: email.extractedSupplier ? '#f0fdf4' : '#fef2f2',
              borderRadius: '8px',
              border: email.extractedSupplier ? '1px solid #bbf7d0' : '1px solid #fecaca'
            }}>
              <strong>Добавувач:</strong>
              {email.extractedSupplier ? (
                <span style={{ marginLeft: '8px' }}>{email.extractedSupplier}</span>
              ) : (
                <span style={{ marginLeft: '8px', color: '#dc2626', fontWeight: 'bold' }}>
                  ⚠️ Недостасува
                </span>
              )}
            </div>
            
            <div style={{ 
              padding: '12px', 
              background: email.extractedLocation ? '#f0fdf4' : '#fef2f2',
              borderRadius: '8px',
              border: email.extractedLocation ? '1px solid #bbf7d0' : '1px solid #fecaca'
            }}>
              <strong>Локација:</strong>
              {email.extractedLocation ? (
                <span style={{ marginLeft: '8px' }}>{email.extractedLocation}</span>
              ) : (
                <span style={{ marginLeft: '8px', color: '#dc2626', fontWeight: 'bold' }}>
                  ⚠️ Недостасува
                </span>
              )}
            </div>
            
            <div style={{ 
              padding: '12px', 
              background: email.extractedDeliveryDate ? '#f0fdf4' : '#fef2f2',
              borderRadius: '8px',
              border: email.extractedDeliveryDate ? '1px solid #bbf7d0' : '1px solid #fecaca'
            }}>
              <strong>Датум на испорака:</strong>
              {email.extractedDeliveryDate ? (
                <span style={{ marginLeft: '8px' }}>{new Date(email.extractedDeliveryDate).toLocaleDateString('mk-MK')}</span>
              ) : (
                <span style={{ marginLeft: '8px', color: '#dc2626', fontWeight: 'bold' }}>
                  ⚠️ Недостасува
                </span>
              )}
            </div>
            
            <div style={{ 
              padding: '12px', 
              background: email.extractedUrgency ? '#f0fdf4' : '#fef2f2',
              borderRadius: '8px',
              border: email.extractedUrgency ? '1px solid #bbf7d0' : '1px solid #fecaca'
            }}>
              <strong>Итеност:</strong>
              {email.extractedUrgency ? (
                <span style={{ 
                  marginLeft: '8px', 
                  padding: '2px 8px',
                  background: email.extractedUrgency === 'HIGH' ? '#ef4444' : '#22c55e',
                  color: 'white',
                  borderRadius: '4px'
                }}>
                  {email.extractedUrgency}
                </span>
              ) : (
                <span style={{ marginLeft: '8px', color: '#dc2626', fontWeight: 'bold' }}>
                  ⚠️ Недостасува
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Email Body */}
        <div className="card">
          <div className="form-group">
            <label>Содржина на email</label>
            <pre style={{ 
              background: '#f9f9f9', 
              padding: '16px', 
              borderRadius: '4px', 
              whiteSpace: 'pre-wrap', 
              maxHeight: '400px', 
              overflow: 'auto',
              border: '1px solid #e5e5e5'
            }}>
              {email.bodyPlainText || email.body || 'Нема содржина'}
            </pre>
          </div>
        </div>

        {/* Related Tasks */}
        <div className="card">
          <h2>📌 Генерирани задачи ({email.tasks?.length || 0})</h2>
          
          {!hasAnyTasks && (
            <div style={{ 
              padding: '20px', 
              textAlign: 'center', 
              background: '#fef3c7', 
              borderRadius: '8px',
              color: '#92400e'
            }}>
              {isUnclassified 
                ? '⚠️ Овој email е некатегоризиран. Класифицирајте го за да се генерираат задачи.'
                : 'Нема генерирани задачи за овој email.'
              }
            </div>
          )}
          
          {hasAnyTasks && (
            <table className="table">
              <thead>
                <tr>
                  <th>Наслов</th>
                  <th>Тип</th>
                  <th>Статус</th>
                  <th>Доделено</th>
                </tr>
              </thead>
              <tbody>
                {(email.tasks || []).map((task) => {
                  const assigneeName = task.assignee?.displayName || 
                    (task.assigneeId ? getRoleLabel(task.assigneeId) : null);
                  
                  return (
                    <tr key={task.id}>
                      <td><a href={`/tasks/${task.id}`} style={{ color: '#0070f3' }}>{task.title}</a></td>
                      <td>
                        <span style={{
                          background: '#e0f2fe',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '13px'
                        }}>
                          {getTaskTypeLabel(task.requestType)}
                        </span>
                      </td>
                      <td>
                        <span className={`badge badge-${task.status.toLowerCase().replace('_', '-')}`}>
                          {task.status === 'PROPOSED' ? 'Предложена' :
                           task.status === 'APPROVED' ? 'Одобрена' :
                           task.status === 'IN_PROGRESS' ? 'Во тек' :
                           task.status === 'DONE' ? 'Завршена' : task.status}
                        </span>
                      </td>
                      <td>
                        {task.status === 'APPROVED' || task.status === 'IN_PROGRESS' || task.status === 'DONE' ? (
                          assigneeName ? (
                            <span style={{ color: '#059669', fontWeight: 'bold' }}>
                              ✓ {assigneeName}
                            </span>
                          ) : (
                            <span style={{ color: '#059669' }}>✓ Доделено</span>
                          )
                        ) : (
                          <span style={{ color: '#9ca3af' }}>Не е доделено</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          
          {hasApprovedTasks && (
            <div style={{ 
              marginTop: '16px',
              padding: '12px',
              background: '#f0fdf4',
              borderRadius: '8px',
              border: '1px solid #bbf7d0',
              textAlign: 'center'
            }}>
              ✓ Сите задачи одобрени и дделени на координатори
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}