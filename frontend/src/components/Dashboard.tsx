'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { taskApi, emailApi, userApi } from '@/lib/api';
import { Task, Email, User, TASK_STATUS } from '@/types';
import Header from '@/components/Header';

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [emails, setEmails] = useState<Email[]>([]);
  const [coordinators, setCoordinators] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tasks');

  const userRole = (session?.user as any)?.role || 'RECEPTION_COORDINATOR';
  const isManager = userRole === 'MANAGER';

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/api/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      loadData();
    }
  }, [session]);

  async function loadData() {
    try {
      const [tasksData, emailsData, coordinatorsData] = await Promise.all([
        isManager ? taskApi.getAll({ status: 'PROPOSED' }) : taskApi.getMyTasks(),
        emailApi.getAll(),
        userApi.getCoordinators(),
      ]);
      setTasks(tasksData);
      setEmails(emailsData);
      setCoordinators(coordinatorsData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
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

  async function handleUpdateTaskStatus(taskId: string, status: string) {
    try {
      await taskApi.updateStatus(taskId, status);
      loadData();
    } catch (error) {
      console.error('Failed to update task status:', error);
    }
  }

  function getStatusBadgeClass(status: string): string {
    const classes: Record<string, string> = {
      PROPOSED: 'badge-proposed',
      APPROVED: 'badge-approved',
      REJECTED: 'badge-rejected',
      IN_PROGRESS: 'badge-in-progress',
      DONE: 'badge-done',
      CANCELLED: 'badge-rejected',
    };
    return classes[status] || '';
  }

  function getRequestTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      INBOUND_RECEIPT: 'Inbound Receipt',
      OUTBOUND_PREPARATION: 'Outbound Prep',
      OUTBOUND_DELIVERY: 'Outbound Delivery',
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

  // Stats
  const stats = {
    totalTasks: tasks.length,
    proposed: tasks.filter(t => t.status === 'PROPOSED').length,
    inProgress: tasks.filter(t => t.status === 'IN_PROGRESS').length,
    done: tasks.filter(t => t.status === 'DONE').length,
  };

  return (
    <div>
      <Header isManager={isManager} />

      <div className="container">
        {/* Stats */}
        <div className="grid grid-4" style={{ marginBottom: '24px' }}>
          <div className="card stat-card">
            <div className="stat-value">{stats.totalTasks}</div>
            <div className="stat-label">Total Tasks</div>
          </div>
          <div className="card stat-card">
            <div className="stat-value">{stats.proposed}</div>
            <div className="stat-label">Proposed</div>
          </div>
          <div className="card stat-card">
            <div className="stat-value">{stats.inProgress}</div>
            <div className="stat-label">In Progress</div>
          </div>
          <div className="card stat-card">
            <div className="stat-value">{stats.done}</div>
            <div className="stat-label">Done</div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ marginBottom: '16px' }}>
          <button
            className={`btn ${activeTab === 'tasks' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('tasks')}
            style={{ marginRight: '8px' }}
          >
            Tasks
          </button>
          <button
            className={`btn ${activeTab === 'emails' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('emails')}
          >
            Emails ({emails.length})
          </button>
        </div>

        {/* Tasks Table */}
        {activeTab === 'tasks' && (
          <div className="card">
            <h2>{isManager ? 'Proposed Tasks' : 'My Tasks'}</h2>
            {tasks.length === 0 ? (
              <div className="empty-state">
                <h3>No tasks found</h3>
                <p>Tasks will appear here when emails are processed.</p>
              </div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Due Date</th>
                    <th>Assignee</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task) => (
                    <tr key={task.id}>
                      <td>
                        <Link href={`/tasks/${task.id}`} style={{ color: '#0078d4' }}>
                          {task.title}
                        </Link>
                      </td>
                      <td>{getRequestTypeLabel(task.requestType)}</td>
                      <td>
                        <span className={`badge ${getStatusBadgeClass(task.status)}`}>
                          {task.status}
                        </span>
                      </td>
                      <td>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '-'}</td>
                      <td>{task.assignee?.displayName || '-'}</td>
                      <td>
                        {isManager && task.status === 'PROPOSED' && (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <select
                              onChange={(e) => {
                                if (e.target.value) {
                                  handleApproveTask(task.id, e.target.value);
                                  e.target.value = '';
                                }
                              }}
                              style={{ padding: '4px', marginRight: '8px' }}
                            >
                              <option value="">Approve to...</option>
                              {coordinators.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.displayName || c.email}
                                </option>
                              ))}
                            </select>
                            <button
                              className="btn btn-danger"
                              style={{ padding: '4px 8px', fontSize: '12px' }}
                              onClick={() => handleRejectTask(task.id)}
                            >
                              Reject
                            </button>
                          </div>
                        )}
                        {!isManager && task.status === 'APPROVED' && (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              className="btn btn-secondary"
                              style={{ padding: '4px 8px', fontSize: '12px' }}
                              onClick={() => handleUpdateTaskStatus(task.id, 'IN_PROGRESS')}
                            >
                              Start
                            </button>
                            <button
                              className="btn btn-success"
                              style={{ padding: '4px 8px', fontSize: '12px' }}
                              onClick={() => handleUpdateTaskStatus(task.id, 'DONE')}
                            >
                              Done
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Emails Table */}
        {activeTab === 'emails' && (
          <div className="card">
            <h2>Processed Emails</h2>
            {emails.length === 0 ? (
              <div className="empty-state">
                <h3>No emails yet</h3>
                <p>Emails will appear here after processing.</p>
              </div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>From</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Received</th>
                  </tr>
                </thead>
                <tbody>
                  {emails.map((email) => (
                    <tr key={email.id}>
                      <td>
                        <Link href={`/emails/${email.id}`} style={{ color: '#0078d4' }}>
                          {email.subject}
                        </Link>
                      </td>
                      <td>{email.sender}</td>
                      <td>{email.requestType ? getRequestTypeLabel(email.requestType) : '-'}</td>
                      <td>
                        <span className={`badge ${email.processingStatus === 'PROCESSED' ? 'badge-approved' : 'badge-proposed'}`}>
                          {email.processingStatus}
                        </span>
                      </td>
                      <td>{new Date(email.receivedAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}