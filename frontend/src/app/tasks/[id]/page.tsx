'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { taskApi, userApi } from '@/lib/api';
import { Task, User, TaskStatus } from '@/types';
import Header from '@/components/Header';

export default function TaskDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const [task, setTask] = useState<Task | null>(null);
  const [coordinators, setCoordinators] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');

  const userRole = (session?.user as any)?.role || 'RECEPTION_COORDINATOR';
  const isManager = userRole === 'MANAGER';

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/api/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    if (session && params.id) {
      loadTask();
    }
  }, [session, params.id]);

  async function loadTask() {
    try {
      const [taskData, coordinatorsData] = await Promise.all([
        taskApi.getById(params.id as string),
        userApi.getCoordinators(),
      ]);
      setTask(taskData);
      setCoordinators(coordinatorsData);
    } catch (error) {
      console.error('Failed to load task:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddComment() {
    if (!newComment.trim()) return;
    try {
      await taskApi.addComment(params.id as string, newComment);
      setNewComment('');
      loadTask();
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  }

  async function handleApprove(assigneeId: string) {
    try {
      await taskApi.approve(params.id as string, assigneeId);
      loadTask();
    } catch (error) {
      console.error('Failed to approve task:', error);
    }
  }

  async function handleReject() {
    try {
      await taskApi.reject(params.id as string, 'Rejected by manager');
      loadTask();
    } catch (error) {
      console.error('Failed to reject task:', error);
    }
  }

  async function handleUpdateStatus(status: TaskStatus) {
    try {
      await taskApi.updateStatus(params.id as string, status);
      loadTask();
    } catch (error) {
      console.error('Failed to update status:', error);
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

  if (!task) {
    return (
      <div className="container">
        <div className="empty-state">
          <h3>Task not found</h3>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header isManager={isManager} />

      <div className="container">
        <div className="grid grid-2">
          {/* Task Info */}
          <div className="card">
            <h2>{task.title}</h2>
            
            <div className="form-group">
              <label>Status</label>
              <span className={`badge badge-${task.status.toLowerCase().replace('_', '-')}`}>
                {task.status}
              </span>
            </div>

            <div className="form-group">
              <label>Request Type</label>
              <p>{task.requestType}</p>
            </div>

            <div className="form-group">
              <label>Description</label>
              <p style={{ whiteSpace: 'pre-wrap' }}>{task.description || 'No description'}</p>
            </div>

            <div className="form-group">
              <label>Due Date</label>
              <p>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'Not set'}</p>
            </div>

            <div className="form-group">
              <label>Assignee</label>
              <p>{task.assignee?.displayName || task.assignee?.email || 'Not assigned'}</p>
            </div>

            {/* Manager Actions */}
            {isManager && task.status === 'PROPOSED' && (
              <div style={{ marginTop: '24px', padding: '16px', background: '#f5f5f5', borderRadius: '8px' }}>
                <h3 style={{ marginBottom: '12px' }}>Manager Actions</h3>
                <div className="form-group">
                  <label>Assign to Coordinator</label>
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        handleApprove(e.target.value);
                        e.target.value = '';
                      }
                    }}
                  >
                    <option value="">Select coordinator...</option>
                    {coordinators.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.displayName || c.email} ({c.role})
                      </option>
                    ))}
                  </select>
                </div>
                <button className="btn btn-danger" onClick={handleReject}>
                  Reject Task
                </button>
              </div>
            )}

            {/* Coordinator Actions */}
            {!isManager && task.status === 'APPROVED' && (
              <div style={{ marginTop: '24px', padding: '16px', background: '#f5f5f5', borderRadius: '8px' }}>
                <h3 style={{ marginBottom: '12px' }}>Update Status</h3>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    className="btn btn-secondary"
                    onClick={() => handleUpdateStatus('IN_PROGRESS')}
                  >
                    Start
                  </button>
                  <button
                    className="btn btn-success"
                    onClick={() => handleUpdateStatus('DONE')}
                  >
                    Mark Done
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Comments */}
          <div className="card">
            <h2>Comments</h2>
            
            <div style={{ marginBottom: '16px' }}>
              {task.comments && task.comments.length > 0 ? (
                <div style={{ marginBottom: '16px' }}>
                  {task.comments.map((comment) => (
                    <div key={comment.id} style={{ padding: '12px', background: '#f9f9f9', borderRadius: '4px', marginBottom: '8px' }}>
                      <p style={{ fontWeight: '500', marginBottom: '4px' }}>
                        {comment.user?.displayName || comment.user?.email}
                      </p>
                      <p style={{ whiteSpace: 'pre-wrap' }}>{comment.content}</p>
                      <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                        {new Date(comment.createdAt).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: '#666' }}>No comments yet</p>
              )}

              <div className="form-group">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  rows={3}
                />
              </div>
              <button className="btn btn-primary" onClick={handleAddComment}>
                Add Comment
              </button>
            </div>
          </div>
        </div>

        {/* Email Source */}
        {task.email && (
          <div className="card" style={{ marginTop: '16px' }}>
            <h2>Source Email</h2>
            <p><strong>Subject:</strong> {task.email.subject}</p>
            <p><strong>From:</strong> {task.email.sender} ({task.email.senderEmail})</p>
            <p><strong>Received:</strong> {new Date(task.email.receivedAt).toLocaleString()}</p>
            {task.email.extractedSupplier && (
              <p><strong>Supplier:</strong> {task.email.extractedSupplier}</p>
            )}
            {task.email.extractedLocation && (
              <p><strong>Location:</strong> {task.email.extractedLocation}</p>
            )}
            {task.email.bodyPlainText && (
              <div style={{ marginTop: '12px' }}>
                <p><strong>Content:</strong></p>
                <pre style={{ background: '#f5f5f5', padding: '12px', borderRadius: '4px', overflow: 'auto' }}>
                  {task.email.bodyPlainText.substring(0, 500)}...
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}