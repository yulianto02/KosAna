import { getToken, logout } from './auth';

// app/src/services/api.ts
const API_BASE_URL = 'http://192.168.0.171:3001/api';
console.log('URL length:', API_BASE_URL.length);
console.log('Last char code:', API_BASE_URL.charCodeAt(API_BASE_URL.length - 1));
// const API_BASE_URL = 'http://192.168.0.171:3001/api';
// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

// Generic fetch wrapper with authentication
async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...(options?.headers as Record<string, string> || {}),
  };
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });
  
  // Handle 401 Unauthorized - token expired or invalid
  if (response.status === 401) {
    logout();
    throw new Error('Session expired. Please login again.');
  }
  
  // Handle 403 Forbidden - insufficient permissions
  if (response.status === 403) {
    throw new Error('You do not have permission to perform this action.');
  }
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }
  
  // Handle empty responses (DELETE operations)
  if (response.status === 204) {
    return undefined as T;
  }
  
  return response.json();
}

// ==================== DASHBOARD ====================
export const dashboardAPI = {
  getStats: (): Promise<any> => fetchAPI('/dashboard/stats'),
};

// ==================== PROPERTIES ====================
export const propertiesAPI = {
  getAll: (): Promise<any[]> => fetchAPI('/properties'),
  getById: (id: string): Promise<any> => fetchAPI(`/properties/${id}`),
  create: (data: any): Promise<any> => fetchAPI('/properties', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: any): Promise<any> => fetchAPI(`/properties/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: string): Promise<void> => fetchAPI(`/properties/${id}`, {
    method: 'DELETE',
  }),
};

// ==================== ROOMS ====================
export const roomsAPI = {
  getAll: (propertyId?: string): Promise<any[]> => 
    fetchAPI(`/rooms${propertyId ? `?propertyId=${propertyId}` : ''}`),
  getById: (id: string): Promise<any> => fetchAPI(`/rooms/${id}`),
  create: (data: any): Promise<any> => fetchAPI('/rooms', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: any): Promise<any> => fetchAPI(`/rooms/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: string): Promise<void> => fetchAPI(`/rooms/${id}`, {
    method: 'DELETE',
  }),
};

// ==================== TENANTS ====================
export const tenantsAPI = {
  getAll: (status?: string): Promise<any[]> => 
    fetchAPI(`/tenants${status ? `?status=${status}` : ''}`),
  getById: (id: string): Promise<any> => fetchAPI(`/tenants/${id}`),
  create: (data: any): Promise<any> => fetchAPI('/tenants', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: any): Promise<any> => fetchAPI(`/tenants/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: string): Promise<void> => fetchAPI(`/tenants/${id}`, {
    method: 'DELETE',
  }),
};

// ==================== PAYMENTS ====================
export const paymentsAPI = {
  getAll: (params?: { status?: string; tenantId?: string }): Promise<any[]> => {
    const query = params ? new URLSearchParams(params as Record<string, string>).toString() : '';
    return fetchAPI(`/payments${query ? `?${query}` : ''}`);
  },
  getById: (id: string): Promise<any> => fetchAPI(`/payments/${id}`),
  create: (data: any): Promise<any> => fetchAPI('/payments', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: any): Promise<any> => fetchAPI(`/payments/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: string): Promise<void> => fetchAPI(`/payments/${id}`, {
    method: 'DELETE',
  }),
  markPaid: (id: string): Promise<any> => fetchAPI(`/payments/${id}/mark-paid`, {
    method: 'POST',
  }),
};

// ==================== EXPENSES ====================
export const expensesAPI = {
  getAll: (params?: { propertyId?: string; category?: string }): Promise<any[]> => {
    const query = params ? new URLSearchParams(params as Record<string, string>).toString() : '';
    return fetchAPI(`/expenses${query ? `?${query}` : ''}`);
  },
  getById: (id: string): Promise<any> => fetchAPI(`/expenses/${id}`),
  create: (data: any): Promise<any> => fetchAPI('/expenses', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: any): Promise<any> => fetchAPI(`/expenses/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: string): Promise<void> => fetchAPI(`/expenses/${id}`, {
    method: 'DELETE',
  }),
  approve: (id: string, approvedBy: string): Promise<any> => fetchAPI(`/expenses/${id}/approve`, {
    method: 'POST',
    body: JSON.stringify({ approvedBy }),
  }),
  reject: (id: string, approvedBy: string): Promise<any> => fetchAPI(`/expenses/${id}/reject`, {
    method: 'POST',
    body: JSON.stringify({ approvedBy }),
  }),
};

// ==================== LAUNDRY ====================
export const laundryAPI = {
  getAll: (status?: string): Promise<any[]> => 
    fetchAPI(`/laundry${status ? `?status=${status}` : ''}`),
  getById: (id: string): Promise<any> => fetchAPI(`/laundry/${id}`),
  create: (data: any): Promise<any> => fetchAPI('/laundry', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: any): Promise<any> => fetchAPI(`/laundry/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: string): Promise<void> => fetchAPI(`/laundry/${id}`, {
    method: 'DELETE',
  }),
  complete: (id: string, completedBy: string): Promise<any> => fetchAPI(`/laundry/${id}/complete`, {
    method: 'POST',
    body: JSON.stringify({ completedBy }),
  }),
};

// ==================== MAINTENANCE ====================
export const maintenanceAPI = {
  getAll: (status?: string): Promise<any[]> => 
    fetchAPI(`/maintenance${status ? `?status=${status}` : ''}`),
  getById: (id: string): Promise<any> => fetchAPI(`/maintenance/${id}`),
  create: (data: any): Promise<any> => fetchAPI('/maintenance', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: any): Promise<any> => fetchAPI(`/maintenance/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: string): Promise<void> => fetchAPI(`/maintenance/${id}`, {
    method: 'DELETE',
  }),
  complete: (id: string, data: any): Promise<any> => fetchAPI(`/maintenance/${id}/complete`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  assign: (id: string, assignedTo: string): Promise<any> => fetchAPI(`/maintenance/${id}/assign`, {
    method: 'POST',
    body: JSON.stringify({ assignedTo }),
  }),
};

// ==================== AC CLEANING ====================
export const acCleaningAPI = {
  getAll: (status?: string): Promise<any[]> => 
    fetchAPI(`/ac-cleaning${status ? `?status=${status}` : ''}`),
  getById: (id: string): Promise<any> => fetchAPI(`/ac-cleaning/${id}`),
  create: (data: any): Promise<any> => fetchAPI('/ac-cleaning', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: any): Promise<any> => fetchAPI(`/ac-cleaning/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: string): Promise<void> => fetchAPI(`/ac-cleaning/${id}`, {
    method: 'DELETE',
  }),
  complete: (id: string, data: any): Promise<any> => fetchAPI(`/ac-cleaning/${id}/complete`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};

// ==================== NOTIFICATIONS ====================
export const notificationsAPI = {
  getAll: (userId?: string, unreadOnly?: boolean): Promise<any[]> => {
    let query = '';
    if (userId) {
      const params = new URLSearchParams({ userId });
      if (unreadOnly) params.append('unreadOnly', 'true');
      query = `?${params.toString()}`;
    }
    return fetchAPI(`/notifications${query}`);
  },
  create: (data: any): Promise<any> => fetchAPI('/notifications', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  markRead: (id: string): Promise<any> => fetchAPI(`/notifications/${id}/read`, {
    method: 'PUT',
  }),
  markAllRead: (userId: string): Promise<any> => fetchAPI('/notifications/mark-all-read', {
    method: 'PUT',
    body: JSON.stringify({ userId }),
  }),
};

// ==================== SETTINGS ====================
export const settingsAPI = {
  get: (): Promise<any> => fetchAPI('/settings'),
  update: (data: any, updatedBy: string): Promise<any> => fetchAPI('/settings', {
    method: 'PUT',
    body: JSON.stringify({ ...data, updatedBy }),
  }),
  updateSingle: (key: string, value: any, type: string, updatedBy: string): Promise<any> => 
    fetchAPI(`/settings/${key}`, {
      method: 'PUT',
      body: JSON.stringify({ value, type, updatedBy }),
    }),
};

// ==================== REPORTS ====================
export const reportsAPI = {
  getRevenue: (): Promise<any[]> => fetchAPI('/reports/revenue'),
  getOccupancy: (): Promise<any[]> => fetchAPI('/reports/occupancy'),
  getExpensesByCategory: (): Promise<any[]> => fetchAPI('/reports/expenses-by-category'),
};