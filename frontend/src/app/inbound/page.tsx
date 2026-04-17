'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { inboundApi, userApi } from '@/lib/api';
import PageShell from '@/components/PageShell';
import { useStatePersistence, useDebounce } from '@/lib/useStatePersistence';

type TabType = 'new' | 'in_progress' | 'completed' | 'urgent';

interface InboundSummary {
  total: number;
  newToday: number;
  pendingClassification: number;
  inProgress: number;
  completed: number;
  urgentCount: number;
  sourceBreakdown: { type: string; count: number }[];
  requestTypeBreakdown: { type: string; count: number }[];
}

interface InboundItem {
  id: string;
  sourceType: string;
  sourceSubType: string | null;
  subject: string | null;
  supplierName: string | null;
  locationName: string | null;
  referenceNumber: string | null;
  requestedDate: string | null;
  receivedAt: string;
  // Use intakeStatus as the authoritative status field
  intakeStatus: string;
  // Keep processingStatus for backward compatibility (may be null)
  processingStatus?: string;
  requestType: string | null;
  priority: string | null;
  tasksGenerated: number;
  case: any;
  cases: any[];
  tasks: any[];
  email: any;
  erpDocument: any;
}

export default function ManagerInboxPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [inboundItems, setInboundItems] = useState<InboundItem[]>([]);
  const [summary, setSummary] = useState<InboundSummary | null>(null);
  const [coordinators, setCoordinators] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('new');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);

  const userRole = (session?.user as any)?.role;
  const isManager = userRole === 'MANAGER';

  const { loadState, saveState } = useStatePersistence('manager', {
    activeTab: 'new',
    search: '',
  });

  useEffect(() => {
    try {
      const saved = loadState();
      if (saved.activeTab) setActiveTab(saved.activeTab as TabType);
      if (saved.search) setSearchQuery(saved.search);
    } catch (e) {
      console.warn('Failed to restore state:', e);
    }
  }, []);

  useEffect(() => {
    saveState({ activeTab, search: searchQuery });
  }, [activeTab, searchQuery]);

  // Debug session
  useEffect(() => {
    console.log('[SESSION DEBUG] session:', session);
    console.log('[SESSION DEBUG] status:', status);
    console.log('[SESSION DEBUG] userRole:', userRole);
    console.log('[SESSION DEBUG] isManager:', isManager);
  }, [session, status, userRole, isManager]);

  useEffect(() => {
    console.log('[LOADER DEBUG] Session:', session);
    console.log('[LOADER DEBUG] Status:', status);
    console.log('[LOADER DEBUG] User role:', userRole);
    console.log('[LOADER DEBUG] Is manager:', isManager);
    
    if (status === 'unauthenticated') {
      router.push('/api/auth/signin');
    } else if (status === 'authenticated' && !isManager) {
      router.push('/');
    }
  }, [status, router, isManager]);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  // Also allow manual refresh
  const handleManualRefresh = () => {
    loadData();
  };

  async function loadData() {
    console.log('[loadData] Starting...');
    try {
      console.log('[loadData] isManager:', isManager);
      
      // Fetch through Next.js API proxy route
      console.log('[loadData] Fetching /api/inbound...');
      try {
        const response = await fetch('/api/inbound');
        const result = await response.json();
        console.log('[loadData] API result length:', result?.length);
        
        if (result && Array.isArray(result)) {
          setInboundItems(result);
          // Fetch summary from API route
          try {
            const summaryResponse = await fetch('/api/inbound/summary');
            const summaryResult = await summaryResponse.json();
            console.log('[loadData] Summary result:', summaryResult);
            setSummary(summaryResult);
          } catch (e) {
            console.error('[loadData] Summary fetch error:', e);
          }
          setLoading(false);
          console.log('[loadData] Data loaded! Count:', result.length);
          return;
        }
      } catch (e) {
        console.error('[loadData] API route fetch error:', e);
      }
      
      // Fall back to API client (uses proxy routes internally)
      let inboundData, summaryData, coordinatorsData;
      
      try {
        inboundData = await inboundApi.getAll({});
      } catch (e) {
        console.error('inboundApi.getAll() failed:', e);
        inboundData = [];
      }
      
      try {
        summaryData = await inboundApi.getSummary();
      } catch (e) {
        console.error('inboundApi.getSummary() failed:', e);
        summaryData = { total: 0, newToday: 0, pendingClassification: 0, inProgress: 0, completed: 0, urgentCount: 0 };
      }
      
      try {
        coordinatorsData = await userApi.getCoordinators();
      } catch (e) {
        console.error('userApi.getCoordinators() failed:', e);
        coordinatorsData = [];
      }
      
      setInboundItems(inboundData || []);
      setSummary(summaryData);
      setCoordinators(coordinatorsData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }

  function getFilteredItems(): InboundItem[] {
    let filtered = [...inboundItems];

    switch (activeTab) {
      case 'new':
        filtered = filtered.filter(item => item.intakeStatus === 'RECLAIMED');
        break;
      case 'in_progress':
        filtered = filtered.filter(item => item.intakeStatus === 'PROCESSED');
        break;
      case 'completed':
        filtered = filtered.filter(item => item.intakeStatus === 'PROCESSED');
        break;
      case 'urgent':
        filtered = filtered.filter(item => 
          item.priority === 'HIGH' || 
          (item.requestedDate && new Date(item.requestedDate) < new Date())
        );
        break;
    }

    if (debouncedSearch) {
      const search = debouncedSearch.toLowerCase();
      filtered = filtered.filter(item =>
        (item.subject?.toLowerCase() || '').includes(search) ||
        (item.supplierName?.toLowerCase() || '').includes(search) ||
        (item.locationName?.toLowerCase() || '').includes(search) ||
        (item.referenceNumber?.toLowerCase() || '').includes(search)
      );
    }

    return filtered;
  }

  function getItemSummary(item: InboundItem): string {
    const parts: string[] = [];
    if (item.locationName) parts.push(`📍 ${item.locationName}`);
    if (item.requestedDate) {
      const date = new Date(item.requestedDate).toLocaleDateString('mk-MK');
      parts.push(`📅 ${date}`);
    }
    if (item.supplierName) parts.push(`🏭 ${item.supplierName}`);
    if (item.priority === 'HIGH') parts.push('⚡ URGENT');
    if (item.requestType) parts.push(`📋 ${item.requestType}`);
    return parts.join(' | ') || 'Нема податоци';
  }

  function getSourceLabel(sourceType: string): string {
    const labels: Record<string, string> = {
      EMAIL: '📧 Email',
      ERP: '📦 ERP',
      MANUAL: '✏️ Рачно',
    };
    return labels[sourceType] || sourceType;
  }

  function handleRowClick(item: InboundItem) {
    router.push(`/inbound/${item.id}`);
  }

  if (loading) {
    return (
      <PageShell title="Manager Inbox" subtitle="Преглед на сите барања">
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <div className="loading-spinner"></div>
          <p>Вчитувам...</p>
        </div>
      </PageShell>
    );
  }

  const filteredItems = getFilteredItems();
  
  // Log detailed render state
  // Render
  return (
    <PageShell title="Manager Inbox" subtitle="Центарaлен преглед на сите влезни податоци">
      {/* Summary Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div style={cardStyle}>
          <div style={cardValueStyle}>{summary?.total || 0}</div>
          <div style={cardLabelStyle}>Вкупни</div>
        </div>
        <div style={{...cardStyle, borderLeft: '4px solid #1976d2'}}>
          <div style={cardValueStyle}>{summary?.newToday || 0}</div>
          <div style={cardLabelStyle}>Денес</div>
        </div>
        <div style={{...cardStyle, borderLeft: '4px solid #ff9800'}}>
          <div style={cardValueStyle}>{summary?.pendingClassification || 0}</div>
          <div style={cardLabelStyle}>Нови</div>
        </div>
        <div style={{...cardStyle, borderLeft: '4px solid #4caf50'}}>
          <div style={cardValueStyle}>{summary?.inProgress || 0}</div>
          <div style={cardLabelStyle}>Во тек</div>
        </div>
        <div style={{...cardStyle, borderLeft: '4px solid #f44336'}}>
          <div style={cardValueStyle}>{summary?.urgentCount || 0}</div>
          <div style={cardLabelStyle}>Ургентни</div>
        </div>
      </div>

      {/* Search */}
      <div style={{ marginBottom: '16px' }}>
        <input
          type="text"
          placeholder="Барај по наслов, добавувач, локација..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 16px',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            fontSize: '14px',
          }}
        />
      </div>

      {/* Tabs */}
      <div style={{ 
        display: 'flex', 
        gap: '8px', 
        marginBottom: '24px',
        borderBottom: '1px solid #e0e0e0'
      }}>
        {(['new', 'in_progress', 'completed', 'urgent'] as TabType[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '12px 24px',
              border: 'none',
              background: activeTab === tab ? '#1976d2' : 'transparent',
              color: activeTab === tab ? 'white' : '#666',
              cursor: 'pointer',
              fontWeight: 'bold',
              borderRadius: '8px 8px 0 0',
            }}
          >
            {tab === 'new' ? 'Нови' : 
             tab === 'in_progress' ? 'Во тек' : 
             tab === 'completed' ? 'Завршени' : 'Ургентни'}
            {' '}({tab === 'new' ? summary?.pendingClassification || 0 :
                tab === 'in_progress' ? summary?.inProgress || 0 :
                tab === 'completed' ? summary?.completed || 0 :
                summary?.urgentCount || 0})
          </button>
        ))}
      </div>

      {/* Inbound Items Table */}
      <div style={{ 
        background: 'white', 
        borderRadius: '12px', 
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        overflow: 'hidden'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: '#f5f5f5' }}>
            <tr>
              <th style={thStyle}>Извор</th>
              <th style={thStyle}>Наслов</th>
              <th style={thStyle}>Податоци</th>
              <th style={thStyle}>Тип</th>
              <th style={thStyle}>Приоритет</th>
              <th style={thStyle}>Задачи</th>
              <th style={thStyle}>Статус</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                  Нема ставки
                </td>
              </tr>
            ) : (
              filteredItems.map(item => (
                <tr 
                  key={item.id} 
                  onClick={() => handleRowClick(item)}
                  style={{ cursor: 'pointer', borderBottom: '1px solid #f0f0f0' }}
                  onMouseOver={(e) => e.currentTarget.style.background = '#f5f5f5'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'white'}
                >
                  <td style={tdStyle}>{getSourceLabel(item.sourceType)}</td>
                  <td style={tdStyle}>
                    <div style={{ fontWeight: 500 }}>
                      {item.subject || item.referenceNumber || 'Без наслов'}
                    </div>
                    <div style={{ fontSize: '12px', color: '#999' }}>
                      {new Date(item.receivedAt).toLocaleString('mk-MK')}
                    </div>
                  </td>
                  <td style={tdStyle}>
                    <div style={{ fontSize: '13px' }}>{getItemSummary(item)}</div>
                  </td>
                  <td style={tdStyle}>
                    <span style={badgeStyle}>
                      {item.requestType || 'Некласифициран'}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    {item.priority === 'HIGH' ? (
                      <span style={{...badgeStyle, background: '#ffebee', color: '#c62828'}}>
                        ⚡ Висок
                      </span>
                    ) : item.priority === 'MEDIUM' ? (
                      <span style={{...badgeStyle, background: '#fff3e0', color: '#ef6c00'}}>
                        Средно
                      </span>
                    ) : (
                      <span style={{...badgeStyle, background: '#e8f5e9', color: '#2e7d32'}}>
                        Низок
                      </span>
                    )}
                  </td>
                  <td style={tdStyle}>
                    {item.tasksGenerated > 0 ? (
                      <span style={badgeStyle}>{item.tasksGenerated} задачи</span>
                    ) : (
                      <span style={{ color: '#999' }}>-</span>
                    )}
                  </td>
                  <td style={tdStyle}>
                    {item.processingStatus === 'RECLAIMED' ? (
                      <span style={{...badgeStyle, background: '#fff3e0', color: '#ef6c00'}}>
                        Нов
                      </span>
                    ) : item.processingStatus === 'PROCESSED' ? (
                      <span style={{...badgeStyle, background: '#e3f2fd', color: '#1565c0'}}>
                        Процесиран
                      </span>
                    ) : item.processingStatus === 'FAILED' ? (
                      <span style={{...badgeStyle, background: '#ffebee', color: '#c62828'}}>
                        Неуспешен
                      </span>
                    ) : (
                      <span style={badgeStyle}>{item.processingStatus}</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </PageShell>
  );
}

const cardStyle: React.CSSProperties = {
  background: 'white',
  padding: '20px',
  borderRadius: '12px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  textAlign: 'center',
};

const cardValueStyle: React.CSSProperties = {
  fontSize: '32px',
  fontWeight: 'bold',
  color: '#333',
};

const cardLabelStyle: React.CSSProperties = {
  fontSize: '14px',
  color: '#666',
  marginTop: '4px',
};

const thStyle: React.CSSProperties = {
  padding: '16px',
  textAlign: 'left',
  fontWeight: 600,
  color: '#666',
  borderBottom: '1px solid #e0e0e0',
};

const tdStyle: React.CSSProperties = {
  padding: '16px',
  verticalAlign: 'top',
};

const badgeStyle: React.CSSProperties = {
  display: 'inline-block',
  padding: '4px 8px',
  borderRadius: '4px',
  fontSize: '12px',
  background: '#f5f5f5',
  color: '#666',
};