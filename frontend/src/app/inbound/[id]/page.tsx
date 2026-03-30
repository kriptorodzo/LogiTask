'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { inboundApi, inboundApi as api } from '@/lib/api';
import PageShell from '@/components/PageShell';

interface InboundItem {
  id: string;
  sourceType: string;
  sourceSubType: string | null;
  sourceId: string | null;
  sourceData: string | null;
  subject: string | null;
  supplierName: string | null;
  locationName: string | null;
  referenceNumber: string | null;
  requestedDate: string | null;
  receivedAt: string;
  ingestedAt: string | null;
  processingStatus: string;
  requestType: string | null;
  priority: string | null;
  tasksGenerated: number;
  case: any;
  tasks: any[];
  email: any;
  erpDocument: any;
}

export default function InboundDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const [item, setItem] = useState<InboundItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const itemId = params.id as string;

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/api/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    if (session && itemId) {
      loadItem();
    }
  }, [session, itemId]);

  async function loadItem() {
    try {
      setLoading(true);
      const data = await api.getById(itemId);
      setItem(data);
    } catch (err) {
      console.error('Failed to load item:', err);
      setError('Неуспешно вчитување на податоците');
    } finally {
      setLoading(false);
    }
  }

  function getSourceLabel(sourceType: string): string {
    const labels: Record<string, string> = {
      EMAIL: '📧 Email',
      ERP: '📦 ERP Документ',
      MANUAL: '✏️ Рачен внос',
    };
    return labels[sourceType] || sourceType;
  }

  function getStatusBadge(status: string) {
    const styles: Record<string, React.CSSProperties> = {
      RECLAIMED: { background: '#fff3e0', color: '#ef6c00' },
      PROCESSED: { background: '#e3f2fd', color: '#1565c0' },
      FAILED: { background: '#ffebee', color: '#c62828' },
      CANCELLED: { background: '#f5f5f5', color: '#999' },
    };
    const style = styles[status] || { background: '#f5f5f5', color: '#666' };
    return (
      <span style={{...badgeStyle, ...style}}>
        {status === 'RECLAIMED' ? 'Нов' : 
         status === 'PROCESSED' ? 'Процесиран' : 
         status === 'FAILED' ? 'Неуспешен' : status}
      </span>
    );
  }

  if (loading) {
    return (
      <PageShell title="Детали" subtitle="Вчитувам...">
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <div className="loading-spinner"></div>
        </div>
      </PageShell>
    );
  }

  if (error || !item) {
    return (
      <PageShell title="Грешка" subtitle="">
        <div style={{ padding: '40px', textAlign: 'center', color: '#c62828' }}>
          {error || 'Податоците не се пронајдени'}
        </div>
        <button onClick={() => router.back()} style={backButtonStyle}>
          ← Назад
        </button>
      </PageShell>
    );
  }

  return (
    <PageShell title="Детали за барање" subtitle={item.referenceNumber || item.id}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Back button */}
        <button onClick={() => router.back()} style={backButtonStyle}>
          ← Назад кон преглед
        </button>

        {/* Header Info */}
        <div style={sectionStyle}>
          <h2 style={sectionTitleStyle}>{getSourceLabel(item.sourceType)}</h2>
          <div style={statusRowStyle}>
            {getStatusBadge(item.processingStatus)}
            {item.priority && (
              <span style={{
                ...badgeStyle,
                background: item.priority === 'HIGH' ? '#ffebee' : '#e8f5e9',
                color: item.priority === 'HIGH' ? '#c62828' : '#2e7d32',
              }}>
                {item.priority === 'HIGH' ? '⚡ Висок приоритет' : 
                 item.priority === 'MEDIUM' ? 'Среден приоритет' : 'Низок приоритет'}
              </span>
            )}
            {item.requestType && (
              <span style={badgeStyle}>{item.requestType}</span>
            )}
          </div>
        </div>

        {/* Main Info Grid */}
        <div style={gridStyle}>
          {/* Subject */}
          <div style={cardStyle}>
            <h3 style={cardTitleStyle}>Наслов</h3>
            <p style={cardValueStyle}>{item.subject || item.referenceNumber || 'Без наслов'}</p>
          </div>

          {/* Supplier */}
          {item.supplierName && (
            <div style={cardStyle}>
              <h3 style={cardTitleStyle}>Добавувач</h3>
              <p style={cardValueStyle}>{item.supplierName}</p>
            </div>
          )}

          {/* Location */}
          {item.locationName && (
            <div style={cardStyle}>
              <h3 style={cardTitleStyle}>Локација</h3>
              <p style={cardValueStyle}>{item.locationName}</p>
            </div>
          )}

          {/* Reference */}
          {item.referenceNumber && (
            <div style={cardStyle}>
              <h3 style={cardTitleStyle}>Број на документ</h3>
              <p style={cardValueStyle}>{item.referenceNumber}</p>
            </div>
          )}

          {/* Requested Date */}
          {item.requestedDate && (
            <div style={cardStyle}>
              <h3 style={cardTitleStyle}>Планиран датум</h3>
              <p style={cardValueStyle}>
                {new Date(item.requestedDate).toLocaleDateString('mk-MK')}
              </p>
            </div>
          )}

          {/* Received Date */}
          <div style={cardStyle}>
            <h3 style={cardTitleStyle}>Примено</h3>
            <p style={cardValueStyle}>
              {new Date(item.receivedAt).toLocaleString('mk-MK')}
            </p>
          </div>
        </div>

        {/* Linked Case */}
        {item.case && (
          <div style={sectionStyle}>
            <h2 style={sectionTitleStyle}>Поврзан случај</h2>
            <div style={gridStyle}>
              <div style={cardStyle}>
                <h3 style={cardTitleStyle}>Статус</h3>
                <p style={cardValueStyle}>{item.case.caseStatus}</p>
              </div>
              <div style={cardStyle}>
                <h3 style={cardTitleStyle}>Класификација</h3>
                <p style={cardValueStyle}>{item.case.classification || '-'}</p>
              </div>
              <div style={cardStyle}>
                <h3 style={cardTitleStyle}>Вкупни задачи</h3>
                <p style={cardValueStyle}>{item.case.totalTasks}</p>
              </div>
              <div style={cardStyle}>
                <h3 style={cardTitleStyle}>Завршени</h3>
                <p style={cardValueStyle}>{item.case.completedTasks}</p>
              </div>
            </div>
          </div>
        )}

        {/* Linked Tasks */}
        {item.tasks && item.tasks.length > 0 && (
          <div style={sectionStyle}>
            <h2 style={sectionTitleStyle}>Задачи ({item.tasks.length})</h2>
            <div style={tableContainerStyle}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: '#f5f5f5' }}>
                  <tr>
                    <th style={thStyle}>Задача</th>
                    <th style={thStyle}>Статус</th>
                    <th style={thStyle}>Доделено на</th>
                    <th style={thStyle}>Рок</th>
                  </tr>
                </thead>
                <tbody>
                  {item.tasks.map((task: any) => (
                    <tr key={task.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td style={tdStyle}>
                        <div style={{ fontWeight: 500 }}>{task.title}</div>
                        <div style={{ fontSize: '12px', color: '#666' }}>{task.requestType}</div>
                      </td>
                      <td style={tdStyle}>
                        <span style={badgeStyle}>{task.status}</span>
                      </td>
                      <td style={tdStyle}>
                        {task.assignee?.displayName || task.assignee?.email || '-'}
                      </td>
                      <td style={tdStyle}>
                        {task.dueDate 
                          ? new Date(task.dueDate).toLocaleDateString('mk-MK')
                          : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Original Source Data */}
        {item.sourceData && (
          <div style={sectionStyle}>
            <h2 style={sectionTitleStyle}>Оригинални податоци</h2>
            <pre style={codeBlockStyle}>
              {JSON.stringify(JSON.parse(item.sourceData), null, 2)}
            </pre>
          </div>
        )}

        {/* Source Email Details */}
        {item.email && (
          <div style={sectionStyle}>
            <h2 style={sectionTitleStyle}>Детали за Email</h2>
            <div style={gridStyle}>
              <div style={cardStyle}>
                <h3 style={cardTitleStyle}>Пратител</h3>
                <p style={cardValueStyle}>{item.email.sender}</p>
              </div>
              <div style={cardStyle}>
                <h3 style={cardTitleStyle}>Email адреса</h3>
                <p style={cardValueStyle}>{item.email.senderEmail}</p>
              </div>
            </div>
          </div>
        )}

        {/* ERP Document Details */}
        {item.erpDocument && (
          <div style={sectionStyle}>
            <h2 style={sectionTitleStyle}>ERP Документ</h2>
            <div style={gridStyle}>
              <div style={cardStyle}>
                <h3 style={cardTitleStyle}>Тип</h3>
                <p style={cardValueStyle}>{item.erpDocument.documentType}</p>
              </div>
              <div style={cardStyle}>
                <h3 style={cardTitleStyle}>Број</h3>
                <p style={cardValueStyle}>{item.erpDocument.documentNumber}</p>
              </div>
              <div style={cardStyle}>
                <h3 style={cardTitleStyle}>Партнер</h3>
                <p style={cardValueStyle}>{item.erpDocument.partnerName || '-'}</p>
              </div>
              <div style={cardStyle}>
                <h3 style={cardTitleStyle}>Локација</h3>
                <p style={cardValueStyle}>{item.erpDocument.destinationName || '-'}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}

const backButtonStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: '#1976d2',
  cursor: 'pointer',
  fontSize: '14px',
  marginBottom: '16px',
  padding: '8px 0',
};

const sectionStyle: React.CSSProperties = {
  marginBottom: '24px',
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: '18px',
  fontWeight: 600,
  color: '#333',
  marginBottom: '16px',
  paddingBottom: '8px',
  borderBottom: '1px solid #e0e0e0',
};

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
  gap: '16px',
};

const cardStyle: React.CSSProperties = {
  background: 'white',
  padding: '16px',
  borderRadius: '8px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
};

const cardTitleStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#666',
  marginBottom: '4px',
  textTransform: 'uppercase',
};

const cardValueStyle: React.CSSProperties = {
  fontSize: '16px',
  color: '#333',
  fontWeight: 500,
};

const statusRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: '8px',
  flexWrap: 'wrap',
  marginTop: '12px',
};

const badgeStyle: React.CSSProperties = {
  display: 'inline-block',
  padding: '4px 8px',
  borderRadius: '4px',
  fontSize: '12px',
  background: '#f5f5f5',
  color: '#666',
};

const tableContainerStyle: React.CSSProperties = {
  background: 'white',
  borderRadius: '8px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  overflow: 'hidden',
};

const thStyle: React.CSSProperties = {
  padding: '12px',
  textAlign: 'left',
  fontWeight: 600,
  color: '#666',
  borderBottom: '1px solid #e0e0e0',
};

const tdStyle: React.CSSProperties = {
  padding: '12px',
};

const codeBlockStyle: React.CSSProperties = {
  background: '#263238',
  color: '#aed581',
  padding: '16px',
  borderRadius: '8px',
  fontSize: '13px',
  overflowX: 'auto',
  maxHeight: '400px',
  overflowY: 'auto',
};