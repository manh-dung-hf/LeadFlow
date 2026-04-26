import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Request interceptor: attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// --- Auth ---
export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  me: () => api.get('/auth/me'),
  updateProfile: (data) => api.patch('/auth/me', data),
  changePassword: (data) => api.put('/auth/me/password', data),
  uploadAvatar: (formData) => api.post('/auth/me/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};

// --- User Management (Admin) ---
export const userService = {
  getUsers: () => api.get('/auth/users'),
  getUser: (id) => api.get(`/auth/users/${id}`),
  createUser: (data) => api.post('/auth/users', data),
  updateUser: (id, data) => api.patch(`/auth/users/${id}`, data),
  resetPassword: (id, newPassword) => api.put(`/auth/users/${id}/password`, { new_password: newPassword }),
  deleteUser: (id) => api.delete(`/auth/users/${id}`),
};

// --- Leads ---
export const leadService = {
  getLeads: (params) => api.get('/leads', { params }),
  getLead: (id) => api.get(`/leads/${id}`),
  createLead: (data) => api.post('/leads', data),
  updateLead: (id, data) => api.patch(`/leads/${id}`, data),
  deleteLead: (id) => api.delete(`/leads/${id}`),
  assignLead: (id, userId) => api.post(`/leads/${id}/assign`, { user_id: userId }),
  getFollowUpSuggestion: (id) => api.post(`/leads/${id}/follow-up`),
  getPipeline: () => api.get('/leads/pipeline'),
  getSalesUsers: () => api.get('/leads/users'),
};

// --- Messages ---
export const messageService = {
  getMessages: (leadId, params) => api.get(`/messages/lead/${leadId}`, { params }),
  sendMessage: (data) => api.post('/messages', data),
  deleteMessage: (id) => api.delete(`/messages/${id}`),
};

// --- Knowledge Base ---
export const knowledgeService = {
  getItems: (q) => api.get('/knowledge', { params: { q } }),
  createItem: (data) => api.post('/knowledge', data),
};

// --- Scripts ---
export const scriptService = {
  getScripts: (category) => api.get('/scripts', { params: { category } }),
  getScript: (id) => api.get(`/scripts/${id}`),
  createScript: (data) => api.post('/scripts', data),
  updateScript: (id, data) => api.patch(`/scripts/${id}`, data),
  deleteScript: (id) => api.delete(`/scripts/${id}`),
  getCategories: () => api.get('/scripts/categories'),
  personalizeScript: (scriptId, leadId, context) =>
    api.post(`/scripts/${scriptId}/personalize`, { lead_id: leadId, context }),
};

// --- Analytics ---
export const analyticsService = {
  getSummary: (params) => api.get('/analytics/summary', { params }),
  getTrends: (days, params) => api.get('/analytics/trends', { params: { days, ...params } }),
  getPerformance: () => api.get('/analytics/performance'),
  getFunnel: (params) => api.get('/analytics/funnel', { params }),
  getActivity: (params) => api.get('/analytics/activity', { params }),
  getLeadActivity: (leadId) => api.get(`/analytics/activity/lead/${leadId}`),
  getAiStatus: () => api.get('/analytics/ai-status'),
  exportLeadsCsv: (params) => api.get('/analytics/export/leads', { params, responseType: 'blob' }),
  exportPerformanceCsv: () => api.get('/analytics/export/performance', { responseType: 'blob' }),
};

// --- Integrations ---
export const integrationService = {
  getAll: () => api.get('/integrations'),
  update: (name, data) => api.put(`/integrations/${name}`, data),
  test: (name) => api.post(`/integrations/test/${name}`),
};

// --- Notifications ---
export const notificationService = {
  getNotifications: (params) => api.get('/notifications', { params }),
  markRead: (id) => api.patch(`/notifications/read/${id}`),
  markAllRead: () => api.patch('/notifications/read-all'),
  getUnreadCount: () => api.get('/notifications/count'),
};

// --- Files ---
export const fileService = {
  uploadLeads: (formData) => api.post('/files/upload/leads', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  uploadKnowledge: (formData) => api.post('/files/upload/knowledge', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  downloadTemplate: () => api.get('/files/template/leads', { responseType: 'blob' }),
};

export default api;
