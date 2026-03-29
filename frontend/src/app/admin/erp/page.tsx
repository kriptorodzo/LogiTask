'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import TopBar from '@/components/TopBar';

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

export default function ErpAdminPage() {
  const [recentDocuments, setRecentDocuments] = useState<ErpDocument[]>([]);
  const [recentBatches, setRecentBatches] = useState<ErpBatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [docsRes, batchesRes] = await Promise.all([
          fetch('/api/erp/documents?pageSize=10'),
          fetch('/api/erp/batches?pageSize=5'),
        ]);

        if (docsRes.ok) {
          const docsData = await docsRes.json();
          setRecentDocuments(docsData.documents || []);
        }

        if (batchesRes.ok) {
          const batchesData = await batchesRes.json();
          setRecentBatches(batchesData.batches || []);
        }
      } catch (error) {
        console.error('Failed to fetch ERP data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const getDocumentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      PURCHASE_ORDER: 'Purchase Order',
      GOODS_RECEIPT: 'Goods Receipt',
      SALES_ORDER: 'Sales Order',
      SHIPMENT_ORDER: 'Shipment',
    };
    return labels[type] || type;
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; color: string }> = {
      PENDING: { bg: '#fff3e0', color: '#ef6c00' },
      PROCESSING: { bg: '#e3f2fd', color: '#1565c0' },
      COMPLETED: { bg: '#e8f5e9', color: '#2e7d32' },
      FAILED: { bg: '#ffebee', color: '#c62828' },
    };
    const style = styles[status] || { bg: '#f5f5f5', color: '#666' };
    return (
      <span style={{
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '12px',
        background: style.bg,
        color: style.color,
      }}>
        {status}
      </span>
    );
  };

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
        <div style={{ marginBottom: '24px' }}>
          <h2>ERP Administration</h2>
        </div>

      {/* Quick Actions */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
        gap: '20px',
        marginBottom: '32px'
      }}>
        <Link href="/admin/erp/import" style={{ textDecoration: 'none' }}>
          <div style={{
            padding: '24px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '12px',
            color: 'white',
            cursor: 'pointer',
            transition: 'transform 0.2s',
          }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>📥</div>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>Import Documents</h3>
            <p style={{ opacity: 0.9, fontSize: '14px' }}>
              Upload CSV/JSON to create ERP documents and tasks
            </p>
          </div>
        </Link>

        <Link href="/admin/erp/routes" style={{ textDecoration: 'none' }}>
          <div style={{
            padding: '24px',
            background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
            borderRadius: '12px',
            color: 'white',
            cursor: 'pointer',
          }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>🗺️</div>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>Route Plans</h3>
            <p style={{ opacity: 0.9, fontSize: '14px' }}>
              Configure delivery routes and schedules
            </p>
          </div>
        </Link>

        <Link href="/admin/erp/documents" style={{ textDecoration: 'none' }}>
          <div style={{
            padding: '24px',
            background: 'linear-gradient(135deg, #fc4a1a 0%, #f7b733 100%)',
            borderRadius: '12px',
            color: 'white',
            cursor: 'pointer',
          }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>📄</div>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>Documents</h3>
            <p style={{ opacity: 0.9, fontSize: '14px' }}>
              View all imported ERP documents
            </p>
          </div>
        </Link>
      </div>

      {/* Recent Documents */}
      <div style={{ 
        background: 'white', 
        borderRadius: '12px', 
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        padding: '24px',
        marginBottom: '24px'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold' }}>Recent Documents</h2>
          <Link href="/admin/erp/documents" style={{ color: '#1976d2', textDecoration: 'none' }}>
            View All →
          </Link>
        </div>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>
        ) : recentDocuments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            No ERP documents yet. Import some to get started.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse',
              fontSize: '14px'
            }}>
              <thead>
                <tr style={{ background: '#f5f5f5' }}>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e0e0e0' }}>Type</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e0e0e0' }}>Document #</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e0e0e0' }}>Partner/Destination</th>
                  <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #e0e0e0' }}>Quantity</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e0e0e0' }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentDocuments.slice(0, 5).map((doc) => (
                  <tr key={doc.id} style={{ borderBottom: '1px solid #e0e0e0' }}>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        background: doc.documentType?.includes('SALES') || doc.documentType?.includes('SHIP') ? '#e3f2fd' : '#fff3e0'
                      }}>
                        {getDocumentTypeLabel(doc.documentType)}
                      </span>
                    </td>
                    <td style={{ padding: '12px', fontFamily: 'monospace' }}>{doc.documentNumber}</td>
                    <td style={{ padding: '12px' }}>
                      {doc.partnerName || doc.destinationName || '-'}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      {doc.totalQuantity > 0 ? doc.totalQuantity.toLocaleString() : '-'}
                    </td>
                    <td style={{ padding: '12px', fontSize: '12px', color: '#666' }}>
                      {doc.plannedDate ? new Date(doc.plannedDate).toLocaleDateString() : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Batches */}
      <div style={{ 
        background: 'white', 
        borderRadius: '12px', 
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        padding: '24px'
      }}>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '20px' }}>Import Batches</h2>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>
        ) : recentBatches.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            No import batches yet.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse',
              fontSize: '14px'
            }}>
              <thead>
                <tr style={{ background: '#f5f5f5' }}>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e0e0e0' }}>File</th>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #e0e0e0' }}>Status</th>
                  <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #e0e0e0' }}>Processed</th>
                  <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #e0e0e0' }}>Errors</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e0e0e0' }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentBatches.map((batch) => (
                  <tr key={batch.id} style={{ borderBottom: '1px solid #e0e0e0' }}>
                    <td style={{ padding: '12px', fontFamily: 'monospace' }}>{batch.fileName}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      {getStatusBadge(batch.status)}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      {batch.processedRows}/{batch.totalRows}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', color: batch.errorRows > 0 ? '#c62828' : '#2e7d32' }}>
                      {batch.errorRows}
                    </td>
                    <td style={{ padding: '12px', fontSize: '12px', color: '#666' }}>
                      {new Date(batch.importedAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </div>
    </>
  );
}