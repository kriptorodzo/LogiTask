import axios from 'axios';
import { getSession } from 'next-auth/react';

// Use relative API routes - all requests go through Next.js proxy
// Browser should never call backend (localhost:4000) directly
const API_URL = '/api';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
apiClient.interceptors.request.use(async (config) => {
  const session = await getSession();
  // For development, use dev-bypass-token if no session
  const token = (session?.user as any)?.accessToken || 'dev-bypass-token';
  config.headers['Authorization'] = `Bearer ${token}`;
  return config;
});

// Log responses
apiClient.interceptors.response.use(
  (response) => {
    console.log('[API RESPONSE] Success:', response.config.url, 'status:', response.status);
    return response;
  },
  (error) => {
    console.log('[API RESPONSE] Error:', error.config?.url, 'status:', error.response?.status);
    return Promise.reject(error);
  }
);

// Email API
export const emailApi = {
  getAll: async (params?: { processingStatus?: string; requestType?: string }) => {
    const { data } = await apiClient.get('/emails', { params });
    return data;
  },
  getById: async (id: string) => {
    const { data } = await apiClient.get(`/emails/${id}`);
    return data;
  },
  updateStatus: async (id: string, status: string) => {
    const { data } = await apiClient.patch(`/emails/${id}/status`, { status });
    return data;
  },
  classify: async (id: string, requestType: string) => {
    const { data } = await apiClient.patch(`/emails/${id}/classify`, { requestType });
    return data;
  },
  createMailbox: async (emailAddress: string, displayName?: string) => {
    const { data } = await apiClient.post('/emails/mailboxes', { emailAddress, displayName });
    return data;
  },
  getMailboxes: async () => {
    const { data } = await apiClient.get('/emails/mailboxes');
    return data;
  },
};

// Task API
export const taskApi = {
  getAll: async (params?: { status?: string; assigneeId?: string; requestType?: string }) => {
    const { data } = await apiClient.get('/tasks', { params });
    return data;
  },
  getById: async (id: string) => {
    const { data } = await apiClient.get(`/tasks/${id}`);
    return data;
  },
  create: async (task: {
    emailId: string;
    title: string;
    description?: string;
    requestType: string;
    dueDate?: string;
    assigneeId?: string;
  }) => {
    const { data } = await apiClient.post('/tasks', task);
    return data;
  },
  update: async (id: string, task: {
    title?: string;
    description?: string;
    assigneeId?: string;
    dueDate?: string;
  }) => {
    const { data } = await apiClient.put(`/tasks/${id}`, task);
    return data;
  },
  approve: async (id: string, assigneeId: string) => {
    const { data } = await apiClient.post(`/tasks/${id}/approve`, { assigneeId }).catch(err => {
      console.error('Approve failed:', err.response?.data || err.message);
      throw err;
    });
    return data;
  },
  reject: async (id: string, reason: string) => {
    const { data } = await apiClient.post(`/tasks/${id}/reject`, { reason });
    return data;
  },
  updateStatus: async (id: string, status: string) => {
    const { data } = await apiClient.put(`/tasks/${id}/status`, { status });
    return data;
  },
  addComment: async (id: string, content: string) => {
    const { data } = await apiClient.post(`/tasks/${id}/comments`, { content });
    return data;
  },
  getMyTasks: async () => {
    const { data } = await apiClient.get('/tasks/my-tasks');
    return data;
  },
};

// User API
export const userApi = {
  getAll: async () => {
    const { data } = await apiClient.get('/users');
    return data;
  },
  getById: async (id: string) => {
    const { data } = await apiClient.get(`/users/${id}`);
    return data;
  },
  getCoordinators: async () => {
    const { data } = await apiClient.get('/users/coordinators');
    return data;
  },
  getCoordinatorsByRole: async (role: string) => {
    const { data } = await apiClient.get(`/users/coordinators/${role}`);
    return data;
  },
  updateRole: async (id: string, role: string) => {
    const { data } = await apiClient.put(`/users/${id}/role`, { role });
    return data;
  },
};

// Auth API
export const authApi = {
  me: async () => {
    const { data } = await apiClient.get('/auth/me');
    return data;
  },
};

// Notifications API
export const notificationApi = {
  getAll: async (limit?: number) => {
    const { data } = await apiClient.get('/notifications', { params: { limit } });
    return data;
  },
  getUnreadCount: async () => {
    const { data } = await apiClient.get('/notifications/unread-count');
    return data;
  },
  markAsRead: async (id: string) => {
    const { data } = await apiClient.post(`/notifications/${id}/read`);
    return data;
  },
};

// Reports API
export const reportsApi = {
  getOverview: async (params?: {
    from?: string;
    to?: string;
    roleCode?: string;
    supplierName?: string;
    locationName?: string;
    coordinatorUserId?: string;
  }) => {
    const { data } = await apiClient.get('/api/reports/overview', { params });
    return data;
  },
  getCases: async (params?: {
    from?: string;
    to?: string;
    otif?: boolean;
    onTime?: boolean;
    inFull?: boolean;
    supplierName?: string;
    locationName?: string;
    classification?: string;
    page?: number;
    pageSize?: number;
  }) => {
    const { data } = await apiClient.get('/api/reports/cases', { params });
    return data;
  },
  getOtifTrend: async (params?: {
    from?: string;
    to?: string;
    groupBy?: 'day' | 'week' | 'month';
    supplierName?: string;
    locationName?: string;
    coordinatorUserId?: string;
  }) => {
    const { data } = await apiClient.get('/api/reports/otif/trend', { params });
    return data;
  },
  getCoordinators: async (params?: {
    from?: string;
    to?: string;
    roleCode?: string;
  }) => {
    const { data } = await apiClient.get('/api/reports/coordinators', { params });
    return data;
  },
  getMyScorecard: async (params?: {
    from?: string;
    to?: string;
    roleCode?: string;
  }) => {
    const { data } = await apiClient.get('/api/reports/my-scorecard', { params });
    return data;
  },
  getSuppliers: async (params?: {
    from?: string;
    to?: string;
  }) => {
    const { data } = await apiClient.get('/api/reports/suppliers', { params });
    return data;
  },
  getLocations: async (params?: {
    from?: string;
    to?: string;
  }) => {
    const { data } = await apiClient.get('/api/reports/locations', { params });
    return data;
  },
  getDelayReasons: async (params?: {
    from?: string;
    to?: string;
    groupBy?: 'reason' | 'coordinator' | 'supplier' | 'location';
  }) => {
    const { data } = await apiClient.get('/api/reports/delays', { params });
    return data;
  },
  recalculate: async (body: {
    from?: string;
    to?: string;
    caseId?: string;
    rebuildSnapshots?: boolean;
  }) => {
    const { data } = await apiClient.post('/api/reports/recalculate', body);
    return data;
  },
  getOverviewV2: async (params?: {
    from?: string;
    to?: string;
    supplierName?: string;
    locationName?: string;
  }) => {
    const { data } = await apiClient.get('/api/reports/overview-v2', { params });
    return data;
  },
  getCasesByStatus: async (params?: {
    status?: string;
    from?: string;
    to?: string;
    supplierName?: string;
    locationName?: string;
    page?: number;
    pageSize?: number;
  }) => {
    const { data } = await apiClient.get('/api/reports/cases-by-status', { params });
    return data;
  },
};

// Performance API (v2)
export const performanceApi = {
  getScorecard: async (userId: string, params?: { month?: number; year?: number }) => {
    const { data } = await apiClient.get(`/performance/scorecard/${userId}`, { params });
    return data;
  },
  getMyScorecard: async (params?: { month?: number; year?: number }) => {
    const { data } = await apiClient.get('/performance/my-scorecard', { params });
    return data;
  },
  getLeaderboard: async (params?: { month?: number; year?: number; role?: string }) => {
    const { data } = await apiClient.get('/performance/leaderboard', { params });
    return data;
  },
  getCoordinators: async (params?: { month?: number; year?: number }) => {
    const { data } = await apiClient.get('/performance/coordinators', { params });
    return data;
  },
  getMetrics: async (userId: string, params?: { month?: number; year?: number }) => {
    const { data } = await apiClient.get(`/performance/metrics/${userId}`, { params });
    return data;
  },
  updateKPI: async (kpi: {
    userId: string;
    month: number;
    year: number;
    tidiness?: number;
    discipline?: number;
    organization?: number;
    fuel?: number;
    incidents?: number;
    returns48h?: number;
    activeRole?: string;
  }) => {
    const { data } = await apiClient.post('/performance/kpi', kpi);
    return data;
  },
  recalculate: async (userId: string, params?: { month?: number; year?: number }) => {
    const { data } = await apiClient.post(`/performance/recalculate/${userId}`, null, { params });
    return data;
  },
};

// Inbound API (Master Inbox)
export const inboundApi = {
  getAll: async (params?: { 
    sourceType?: string; 
    processingStatus?: string; 
    requestType?: string;
    priority?: string;
  }) => {
    const { data } = await apiClient.get('/inbound', { params });
    return data;
  },
  getById: async (id: string) => {
    const { data } = await apiClient.get(`/inbound/${id}`);
    return data;
  },
  getSummary: async () => {
    const { data } = await apiClient.get('/inbound/summary');
    return data;
  },
  getCoordinatorSummary: async (userId: string) => {
    const { data } = await apiClient.get(`/inbound/coordinator/${userId}`);
    return data;
  },
  process: async (id: string, data: {
    requestType?: string;
    priority?: string;
    supplierName?: string;
    locationName?: string;
    dueDate?: string;
  }) => {
    const { data: result } = await apiClient.patch(`/inbound/${id}/process`, data);
    return result;
  },
};

export default apiClient;