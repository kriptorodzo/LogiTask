'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { emailApi } from '@/lib/api';
import { Email } from '@/types';
import Header from '@/components/Header';

export default function EmailDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const [email, setEmail] = useState<Email | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/api/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    if (session && params.id) {
      loadEmail();
    }
  }, [session, params.id]);

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

  return (
    <div>
      <Header isManager={false} />

      <div className="container">
        <div className="card">
          <h2>{email.subject}</h2>
          
          <div className="grid grid-2" style={{ marginBottom: '16px' }}>
            <div>
              <p><strong>From:</strong> {email.sender}</p>
              <p><strong>Email:</strong> {email.senderEmail}</p>
            </div>
            <div>
              <p><strong>Received:</strong> {new Date(email.receivedAt).toLocaleString()}</p>
              <p><strong>Status:</strong> <span className={`badge ${email.processingStatus === 'PROCESSED' ? 'badge-approved' : 'badge-proposed'}`}>{email.processingStatus}</span></p>
            </div>
          </div>

          {email.requestType && (
            <div className="form-group">
              <label>Classified Type</label>
              <p>{email.requestType}</p>
            </div>
          )}

          {/* Extracted Entities */}
          {(email.extractedSupplier || email.extractedLocation || email.extractedDeliveryDate || email.extractedUrgency) && (
            <div style={{ marginBottom: '16px', padding: '16px', background: '#f5f5f5', borderRadius: '8px' }}>
              <h3>Extracted Information</h3>
              <div className="grid grid-2">
                {email.extractedSupplier && <p><strong>Supplier:</strong> {email.extractedSupplier}</p>}
                {email.extractedLocation && <p><strong>Location:</strong> {email.extractedLocation}</p>}
                {email.extractedDeliveryDate && <p><strong>Delivery Date:</strong> {new Date(email.extractedDeliveryDate).toLocaleDateString()}</p>}
                {email.extractedUrgency && <p><strong>Urgency:</strong> <span className="badge badge-proposed">{email.extractedUrgency}</span></p>}
              </div>
            </div>
          )}

          {/* Email Body */}
          <div className="form-group">
            <label>Email Content</label>
            <pre style={{ background: '#f9f9f9', padding: '16px', borderRadius: '4px', whiteSpace: 'pre-wrap', maxHeight: '400px', overflow: 'auto' }}>
              {email.bodyPlainText || email.body || 'No content'}
            </pre>
          </div>
        </div>

        {/* Related Tasks */}
        {email.tasks && email.tasks.length > 0 && (
          <div className="card">
            <h2>Generated Tasks ({email.tasks.length})</h2>
            <table className="table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Assignee</th>
                </tr>
              </thead>
              <tbody>
                {email.tasks.map((task) => (
                  <tr key={task.id}>
                    <td><a href={`/tasks/${task.id}`}>{task.title}</a></td>
                    <td>{task.requestType}</td>
                    <td><span className={`badge badge-${task.status.toLowerCase().replace('_', '-')}`}>{task.status}</span></td>
                    <td>{task.assignee?.displayName || 'Not assigned'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}