'use client';

import { useState, useCallback } from 'react';
import PageShell from '@/components/PageShell';

interface ErpDocumentRow {
  documentType: string;
  documentNumber: string;
  partnerName?: string;
  destinationName?: string;
  lineCount?: number;
  totalQuantity?: number;
  plannedDate?: string;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

interface BatchResult {
  batchId: string;
  totalRows: number;
  processedRows: number;
  errorRows: number;
  documents: Array<{
    id: string;
    documentNumber: string;
    documentType: string;
    taskIds: string[];
  }>;
  errors: string[];
}

const DOCUMENT_TYPES = ['PURCHASE_ORDER', 'GOODS_RECEIPT', 'SALES_ORDER', 'SHIPMENT_ORDER'];

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  PURCHASE_ORDER: 'Purchase Order',
  GOODS_RECEIPT: 'Goods Receipt',
  SALES_ORDER: 'Sales Order',
  SHIPMENT_ORDER: 'Shipment Order',
};

export default function ErpImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<ErpDocumentRow[]>([]);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<BatchResult | null>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'preview' | 'results'>('upload');

  const parseCSV = useCallback((content: string): ErpDocumentRow[] => {
    const lines = content.split('\n').filter(l => l.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const parsed: ErpDocumentRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const row: any = {};

      headers.forEach((header, idx) => {
        const value = values[idx] || '';
        switch (header) {
          case 'documenttype':
            row.documentType = value;
            break;
          case 'documentnumber':
            row.documentNumber = value;
            break;
          case 'partnername':
          case 'partner':
            row.partnerName = value;
            break;
          case 'destinationname':
          case 'destination':
            row.destinationName = value;
            break;
          case 'linecount':
          case 'lines':
            row.lineCount = parseInt(value) || 0;
            break;
          case 'totalquantity':
          case 'quantity':
            row.totalQuantity = parseInt(value) || 0;
            break;
          case 'planneddate':
          case 'date':
            row.plannedDate = value;
            break;
        }
      });

      if (row.documentType && row.documentNumber) {
        parsed.push(row as ErpDocumentRow);
      }
    }

    return parsed;
  }, []);

  const parseJSON = useCallback((content: string): ErpDocumentRow[] => {
    try {
      const data = JSON.parse(content);
      if (Array.isArray(data)) return data;
      if (data.rows) return data.rows;
      if (data.documents) return data.documents;
      return [data];
    } catch {
      return [];
    }
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setResult(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const extension = selectedFile.name.split('.').pop()?.toLowerCase();

      let parsed: ErpDocumentRow[] = [];
      if (extension === 'csv') {
        parsed = parseCSV(content);
      } else if (extension === 'json') {
        parsed = parseJSON(content);
      }

      setRows(parsed);
      if (parsed.length > 0) {
        setActiveTab('preview');
      }
    };
    reader.readAsText(selectedFile);
  }, [parseCSV, parseJSON]);

  const handleJSONPaste = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const content = e.target.value;
    if (!content.trim()) {
      setRows([]);
      return;
    }

    const parsed = parseJSON(content);
    setRows(parsed);
    if (parsed.length > 0) {
      setActiveTab('preview');
    }
  }, [parseJSON]);

  const validateRows = useCallback((): ValidationError[] => {
    const validationErrors: ValidationError[] = [];

    rows.forEach((row, index) => {
      if (!row.documentType) {
        validationErrors.push({ row: index + 1, field: 'documentType', message: 'Document type is required' });
      } else if (!DOCUMENT_TYPES.includes(row.documentType.toUpperCase().trim().replace(/[\s-]/g, '_'))) {
        validationErrors.push({ row: index + 1, field: 'documentType', message: `Invalid document type: ${row.documentType}` });
      }

      if (!row.documentNumber) {
        validationErrors.push({ row: index + 1, field: 'documentNumber', message: 'Document number is required' });
      }

      if (row.plannedDate) {
        const date = new Date(row.plannedDate);
        if (isNaN(date.getTime())) {
          validationErrors.push({ row: index + 1, field: 'plannedDate', message: `Invalid date format: ${row.plannedDate}` });
        }
      }
    });

    return validationErrors;
  }, [rows]);

  const handleImport = async () => {
    const validationErrors = validateRows();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors([]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/erp/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: JSON.stringify(rows) }),
      });

      if (!response.ok) {
        throw new Error('Import failed');
      }

      const data = await response.json();
      setResult(data);
      setActiveTab('results');
    } catch (error) {
      console.error('Import error:', error);
      setErrors([{ row: 0, field: 'general', message: 'Failed to import documents. Please try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setFile(null);
    setRows([]);
    setErrors([]);
    setResult(null);
    setActiveTab('upload');
  };

  return (
    <PageShell title="ERP Import" subtitle="Import documents and create tasks">
      <div style={{ padding: '24px' }}>
        <div style={{ marginBottom: '24px' }}>
          <div></div>
        </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', borderBottom: '1px solid #e0e0e0' }}>
        {(['upload', 'preview', 'results'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            disabled={tab === 'preview' && rows.length === 0}
            style={{
              padding: '12px 24px',
              border: 'none',
              background: activeTab === tab ? '#1976d2' : 'transparent',
              color: activeTab === tab ? 'white' : '#666',
              cursor: tab === 'preview' && rows.length === 0 ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
            }}
          >
            {tab === 'upload' ? 'Upload' : tab === 'preview' ? `Preview (${rows.length})` : 'Results'}
          </button>
        ))}
      </div>

      {/* Upload Tab */}
      {activeTab === 'upload' && (
        <div style={{ display: 'flex', gap: '24px' }}>
          {/* File Upload */}
          <div style={{ flex: 1, padding: '24px', border: '1px solid #e0e0e0', borderRadius: '8px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>Upload File</h2>
            <p style={{ color: '#666', marginBottom: '16px' }}>Supports CSV or JSON format</p>
            
            <input
              type="file"
              accept=".csv,.json"
              onChange={handleFileChange}
              style={{ marginBottom: '16px' }}
            />

            {file && (
              <div style={{ 
                padding: '12px', 
                background: '#f5f5f5', 
                borderRadius: '4px',
                marginTop: '12px'
              }}>
                <strong>Selected:</strong> {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </div>
            )}
          </div>

          {/* JSON Paste */}
          <div style={{ flex: 1, padding: '24px', border: '1px solid #e0e0e0', borderRadius: '8px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>Or Paste JSON</h2>
            <p style={{ color: '#666', marginBottom: '16px' }}>Paste JSON array of documents</p>
            
            <textarea
              onChange={handleJSONPaste}
              placeholder={`[
  {
    "documentType": "PURCHASE_ORDER",
    "documentNumber": "PO-2024-001",
    "partnerName": "Ероглу",
    "lineCount": 50,
    "totalQuantity": 1500,
    "plannedDate": "2024-03-20"
  }
]`}
              style={{
                width: '100%',
                height: '200px',
                padding: '12px',
                border: '1px solid #e0e0e0',
                borderRadius: '4px',
                fontFamily: 'monospace',
                fontSize: '14px',
              }}
            />
          </div>
        </div>
      )}

      {/* Preview Tab */}
      {activeTab === 'preview' && (
        <div>
          {errors.length > 0 && (
            <div style={{ 
              padding: '16px', 
              background: '#ffebee', 
              border: '1px solid #f44336',
              borderRadius: '8px',
              marginBottom: '16px'
            }}>
              <h3 style={{ color: '#f44336', marginBottom: '8px' }}>Validation Errors</h3>
              <ul style={{ margin: 0, paddingLeft: '20px', color: '#c62828' }}>
                {errors.map((err, idx) => (
                  <li key={idx}>Row {err.row}: {err.message}</li>
                ))}
              </ul>
            </div>
          )}

          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '16px'
          }}>
            <h2 style={{ fontSize: '18px' }}>{rows.length} Documents Ready to Import</h2>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={handleClear}
                style={{
                  padding: '10px 20px',
                  border: '1px solid #e0e0e0',
                  background: 'white',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Clear
              </button>
              <button
                onClick={handleImport}
                disabled={isLoading || errors.length > 0}
                style={{
                  padding: '10px 24px',
                  border: 'none',
                  background: errors.length > 0 ? '#ccc' : '#4caf50',
                  color: 'white',
                  borderRadius: '4px',
                  cursor: errors.length > 0 ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold',
                }}
              >
                {isLoading ? 'Importing...' : `Import ${rows.length} Documents`}
              </button>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse',
              fontSize: '14px'
            }}>
              <thead>
                <tr style={{ background: '#f5f5f5' }}>
                  <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #e0e0e0' }}>Document Type</th>
                  <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #e0e0e0' }}>Document Number</th>
                  <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #e0e0e0' }}>Partner</th>
                  <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #e0e0e0' }}>Destination</th>
                  <th style={{ padding: '12px', textAlign: 'right', border: '1px solid #e0e0e0' }}>Lines</th>
                  <th style={{ padding: '12px', textAlign: 'right', border: '1px solid #e0e0e0' }}>Quantity</th>
                  <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #e0e0e0' }}>Planned Date</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #e0e0e0' }}>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        background: row.documentType?.includes('SALES') || row.documentType?.includes('SHIP') ? '#e3f2fd' : '#fff3e0'
                      }}>
                        {DOCUMENT_TYPE_LABELS[row.documentType] || row.documentType}
                      </span>
                    </td>
                    <td style={{ padding: '12px', fontFamily: 'monospace' }}>{row.documentNumber}</td>
                    <td style={{ padding: '12px' }}>{row.partnerName || '-'}</td>
                    <td style={{ padding: '12px' }}>{row.destinationName || '-'}</td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>{row.lineCount || 0}</td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>{row.totalQuantity || 0}</td>
                    <td style={{ padding: '12px' }}>{row.plannedDate || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Results Tab */}
      {activeTab === 'results' && result && (
        <div>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(4, 1fr)', 
            gap: '16px',
            marginBottom: '24px'
          }}>
            <div style={{ 
              padding: '20px', 
              background: '#e8f5e9', 
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#2e7d32' }}>
                {result.totalRows}
              </div>
              <div style={{ color: '#666' }}>Total Rows</div>
            </div>
            <div style={{ 
              padding: '20px', 
              background: '#e3f2fd', 
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#1565c0' }}>
                {result.processedRows}
              </div>
              <div style={{ color: '#666' }}>Processed</div>
            </div>
            <div style={{ 
              padding: '20px', 
              background: '#fff3e0', 
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#ef6c00' }}>
                {result.errorRows}
              </div>
              <div style={{ color: '#666' }}>Errors</div>
            </div>
            <div style={{ 
              padding: '20px', 
              background: '#f3e5f5', 
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#7b1fa2' }}>
                {result.documents.length}
              </div>
              <div style={{ color: '#666' }}>Documents</div>
            </div>
          </div>

          {result.errors.length > 0 && (
            <div style={{ 
              padding: '16px', 
              background: '#ffebee', 
              border: '1px solid #f44336',
              borderRadius: '8px',
              marginBottom: '24px'
            }}>
              <h3 style={{ color: '#f44336', marginBottom: '8px' }}>Import Errors</h3>
              <ul style={{ margin: 0, paddingLeft: '20px', color: '#c62828' }}>
                {result.errors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          <h3 style={{ marginBottom: '16px' }}>Imported Documents</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse',
              fontSize: '14px'
            }}>
              <thead>
                <tr style={{ background: '#f5f5f5' }}>
                  <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #e0e0e0' }}>Document Type</th>
                  <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #e0e0e0' }}>Document Number</th>
                  <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #e0e0e0' }}>Tasks Created</th>
                  <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #e0e0e0' }}>ID</th>
                </tr>
              </thead>
              <tbody>
                {result.documents.map((doc, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #e0e0e0' }}>
                    <td style={{ padding: '12px' }}>
                      {DOCUMENT_TYPE_LABELS[doc.documentType] || doc.documentType}
                    </td>
                    <td style={{ padding: '12px', fontFamily: 'monospace' }}>{doc.documentNumber}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        background: doc.taskIds.length > 0 ? '#e8f5e9' : '#fff3e0',
                        color: doc.taskIds.length > 0 ? '#2e7d32' : '#ef6c00',
                      }}>
                        {doc.taskIds.length} task(s)
                      </span>
                    </td>
                    <td style={{ padding: '12px', fontSize: '12px', color: '#666' }}>{doc.id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            onClick={handleClear}
            style={{
              marginTop: '24px',
              padding: '12px 24px',
              border: '1px solid #e0e0e0',
              background: 'white',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            Import More
          </button>
        </div>
      )}
    </div>
    </PageShell>
  );
}