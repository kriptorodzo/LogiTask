import axios from 'axios';
import { getSession } from 'next-auth/react';

const API_URL = process.env.BACKEND_URL || 'http://localhost:4000';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
apiClient.interceptors.request.use(async (config) => {
  const session = await getSession();
  if (session && (session as any).accessToken) {
    config.headers.Authorization = `Bearer ${(session as any).accessToken}`;
  }
  return config;
});

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
    const { data } = await apiClient.post(`/tasks/${id}/approve`, { assigneeId });
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
};

export default apiClient;