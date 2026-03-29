'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import TopBar from '@/components/TopBar';
import { KpiCard, StatusBadge } from '@/components';

interface ErpDocument {
  id: string;
  documentType: string;
  documentNumber: string;
  partnerName: string | null;
  destinationName: string | null;
  lineCount: number;
  totalQuantity: number;
  plannedDate: string | null;
  createdAt: string;
}

interface ErpBatch {
  id: string;
  fileName: string;
  status: string;
  totalRows: number;
  processedRows: number;
  errorRows: number;
  importedAt: string;
}

interface ErpStats {
  totalDocuments: number;
  totalBatches: number;
  pendingCount: number;
  completedCount: number;
}

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  PENDING: { bg: '#fff3e0', color: '#ef6c00' },
  PROCESSING: { bg: '#e3f2fd', color: '#1565c0' },
  COMPLETED: { bg: '#e8f5e9', color: '#2e7d32' },
  FAILED: { bg: '#ffebee', color: '#c62828' },
};

export default function ErpAdminPage() {
  const [recentDocuments, setRecentDocuments] = useState<ErpDocument[]>([]);
  const [recentBatches, setRecentBatches] = useState<ErpBatch[]>([]);
  const [stats, setStats] = useState<ErpStats>({
    totalDocuments: 0,
    totalBatches: 0,
    pendingCount: 0,
    completedCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [docsRes, batchesRes] = await Promise.all([
          fetch('/api/erp/documents?pageSize=100'),
          fetch('/api/erp/batches?pageSize=100'),
        ]);

        if (docsRes.ok) {
          const docsData = await docsRes.json();
          setRecentDocuments(docsData.documents?.slice(0, 10) || []);
          setStats(prev => ({
            ...prev,
            totalDocuments: docsData.total || 0,
          }));
        }

        if (batchesRes.ok) {
          const batchesData = await batchesRes.json();
          setRecentBatches(batchesData.batches?.slice(0, 5) || []);
          setStats(prev => ({
            ...prev,
            totalBatches: batchesData.total || 0,
            pendingCount: batchesData.batches?.filter((b: ErpBatch) => b.status !== 'COMPLETED').length || 0,
            completedCount: batchesData.batches?.filter((b: ErpBatch) => b.status === 'COMPLETED').length || 0,
          }));
        }
      } catch (error) {
        console.error('Failed to fetch ERP data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <>
      <TopBar 
        title="ERP Administration"
        subtitle="Manage ERP imports, documents, and route plans"
        breadcrumbs={[
          { label: 'ERP', href: '/admin/erp' }
        ]}
      />
      <div className="page-content">
        {/* Quick Actions */}
        <div className="erp-actions">
          <Link href="/admin/erp/import" className="erp-action-card erp-action-primary">
            <span className="erp-action-icon">📥</span>
            <div className="erp-action-content">
              <h3>Import Documents</h3>
              <p>Upload CSV/JSON to create ERP documents and tasks</p>
            </div>
          </Link>

          <Link href="/admin/erp/routes" className="erp-action-card erp-action-success">
            <span className="erp-action-icon">🗺️</span>
            <div className="erp-action-content">
              <h3>Route Plans</h3>
              <p>Configure delivery routes and schedules</p>
            </div>
          </Link>

          <Link href="/admin/erp/documents" className="erp-action-card erp-action-warning">
            <span className="erp-action-icon">📄</span>
            <div className="erp-action-content">
              <h3>All Documents</h3>
              <p>View and manage all ERP documents</p>
            </div>
          </Link>
        </div>

        {/* Stats */}
        <div className="kpi-grid">
          <KpiCard 
            label="Total Documents" 
            value={stats.totalDocuments}
            color="blue"
            icon="📋"
          />
          <KpiCard 
            label="Import Batches" 
            value={stats.totalBatches}
            color="purple"
            icon="📦"
          />
          <KpiCard 
            label="Pending" 
            value={stats.pendingCount}
            color="orange"
            icon="⏳"
          />
          <KpiCard 
            label="Completed" 
            value={stats.completedCount}
            color="green"
            icon="✅"
          />
        </div>

        {/* Recent Documents */}
        <div className="erp-section">
          <div className="erp-section-header">
            <h3>Recent Documents</h3>
            <Link href="/admin/erp/documents" className="link-honey">
              View all →
            </Link>
          </div>

          {isLoading ? (
            <div className="loading-skeleton">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="skeleton-row" />
              ))}
            </div>
          ) : recentDocuments.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📋</div>
              <h3>No documents yet</h3>
              <p>Import ERP documents to get started</p>
            </div>
          ) : (
            <table className="erp-table">
              <thead>
                <tr>
                  <th>Document</th>
                  <th>Type</th>
                  <th>Partner</th>
                  <th>Destination</th>
                  <th>Planned Date</th>
                </tr>
              </thead>
              <tbody>
                {recentDocuments.map((doc) => (
                  <tr key={doc.id}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 500 }}>
                      {doc.documentNumber}
                    </td>
                    <td>
                      <StatusBadge status={doc.documentType} />
                    </td>
                    <td>{doc.partnerName || '-'}</td>
                    <td>{doc.destinationName || '-'}</td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                      {doc.plannedDate 
                        ? new Date(doc.plannedDate).toLocaleDateString('mk-MK')
                        : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Recent Batches */}
        <div className="erp-section">
          <div className="erp-section-header">
            <h3>Recent Import Batches</h3>
          </div>

          {isLoading ? (
            <div className="loading-skeleton">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="skeleton-row" />
              ))}
            </div>
          ) : recentBatches.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📦</div>
              <h3>No import batches yet</h3>
              <p>Upload a file to create your first batch</p>
            </div>
          ) : (
            <table className="erp-table">
              <thead>
                <tr>
                  <th>File</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Processed</th>
                  <th style={{ textAlign: 'right' }}>Errors</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentBatches.map((batch) => {
                  const statusStyle = STATUS_COLORS[batch.status] || { bg: '#f5f5f5', color: '#666' };
                  return (
                    <tr key={batch.id}>
                      <td style={{ fontFamily: 'monospace', fontSize: '13px' }}>
                        {batch.fileName}
                      </td>
                      <td>
                        <span 
                          style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            background: statusStyle.bg,
                            color: statusStyle.color,
                          }}
                        >
                          {batch.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>
                        {batch.processedRows}/{batch.totalRows}
                      </td>
                      <td style={{ 
                        textAlign: 'right', 
                        fontFamily: 'monospace',
                        color: batch.errorRows > 0 ? 'var(--color-red)' : 'var(--color-green)'
                      }}>
                        {batch.errorRows}
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                        {new Date(batch.importedAt).toLocaleString('mk-MK')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
