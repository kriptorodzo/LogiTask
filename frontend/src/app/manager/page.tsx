'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { emailApi, taskApi, userApi } from '@/lib/api';
import { Email, Task, User } from '@/types';
import Header from '@/components/Header';

export default function ManagerInboxPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [emails, setEmails] = useState<Email[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [coordinators, setCoordinators] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'emails' | 'tasks'>('emails');

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
        taskApi.getAll({ status: 'PROPOSED' }),
        userApi.getCoordinators(),
      ]);
      setEmails(emailsData);
      setTasks(tasksData);
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

  if (loading) {
    return (
      <div className="container">
        <div className="empty-state">
          <h3>Loading...</h3>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header isManager={true} />

      <div className="container">
        {/* Tabs */}
        <div style={{ marginBottom: '16px' }}>
          <button
            className={`btn ${activeTab === 'emails' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('emails')}
            style={{ marginRight: '8px' }}
          >
            Received Emails ({emails.length})
          </button>
          <button
            className={`btn ${activeTab === 'tasks' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('tasks')}
          >
            Proposed Tasks ({tasks.length})
          </button>
        </div>

        {/* Emails Tab */}
        {activeTab === 'emails' && (
          <div className="card">
            <h2>All Received Emails</h2>
            {emails.length === 0 ? (
              <div className="empty-state">
                <h3>No emails yet</h3>
              </div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>From</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Tasks</th>
                    <th>Received</th>
                  </tr>
                </thead>
                <tbody>
                  {emails.map((email) => (
                    <tr key={email.id}>
                      <td>
                        <a href={`/emails/${email.id}`} style={{ color: '#0078d4' }}>
                          {email.subject}
                        </a>
                      </td>
                      <td>{email.sender}</td>
                      <td>{email.requestType || '-'}</td>
                      <td>
                        <span className={`badge ${email.processingStatus === 'PROCESSED' ? 'badge-approved' : 'badge-proposed'}`}>
                          {email.processingStatus}
                        </span>
                      </td>
                      <td>{email.tasks?.length || 0}</td>
                      <td>{new Date(email.receivedAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Tasks Tab */}
        {activeTab === 'tasks' && (
          <div className="card">
            <h2>Proposed Tasks - Review Required</h2>
            {tasks.length === 0 ? (
              <div className="empty-state">
                <h3>No proposed tasks</h3>
                <p>All tasks have been reviewed.</p>
              </div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Type</th>
                    <th>Due Date</th>
                    <th>Source Email</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task) => (
                    <tr key={task.id}>
                      <td>
                        <a href={`/tasks/${task.id}`} style={{ color: '#0078d4' }}>
                          {task.title}
                        </a>
                      </td>
                      <td>{task.requestType}</td>
                      <td>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '-'}</td>
                      <td>
                        {task.email && (
                          <a href={`/emails/${task.email.id}`} style={{ color: '#0078d4' }}>
                            {task.email.subject.substring(0, 40)}...
                          </a>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <select
                            onChange={(e) => {
                              if (e.target.value) {
                                handleApproveTask(task.id, e.target.value);
                                e.target.value = '';
                              }
                            }}
                            style={{ padding: '4px' }}
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
                      </td>
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