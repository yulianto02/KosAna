import { getToken, getRefreshToken as getRefresh, setTokens as saveTokens } from './auth';
import { API_BASE_URL } from '../config/api';
import type { RoomCleaningSchedule, CleaningStats } from '@/types';

console.log('API Base:', API_BASE_URL);

// Normalize endpoint: prevent /api/api/ duplication
function normalizeEndpoint(endpoint: string): string {
  // API_BASE_URL may already end with /api
  // If endpoint starts with /api/, strip it -> /api/users => /users
  if (API_BASE_URL.endsWith('/api') && endpoint.startsWith('/api/')) {
    return endpoint.slice(4); // remove /api
  }
  return endpoint;
}

let isRefreshing = false;
let failedQueue: Array<{ resolve: (t: string) => void; reject: (e: any) => void }> = [];

function processQueue(error: any, token: string | null = null) {
  failedQueue.forEach(p => { if (error) p.reject(error); else p.resolve(token!); });
  failedQueue = [];
}

async function refreshAccessToken(): Promise<string> {
  const refreshToken = getRefresh ? getRefresh() : localStorage.getItem('kosana_refresh_token');
  if (!refreshToken) throw new Error('No refresh token');
  if (isRefreshing) return new Promise<string>((resolve, reject) => { failedQueue.push({ resolve, reject }); });
  isRefreshing = true;
  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`.replace('/api/api/', '/api/'), {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken })
    });
    if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error((err as any).error || 'Refresh failed'); }
    const data = await res.json();
    const newAccess = (data as any).accessToken || (data as any).token;
    const newRefresh = (data as any).refreshToken || refreshToken;
    if (saveTokens) saveTokens(newAccess, newRefresh);
    else {
      localStorage.setItem('kosana_token', newAccess);
      localStorage.setItem('kosana_access_token', newAccess);
      localStorage.setItem('kosana_refresh_token', newRefresh);
    }
    processQueue(null, newAccess);
    return newAccess;
  } catch (e) {
    processQueue(e, null);
    localStorage.removeItem('kosana_token');
    localStorage.removeItem('kosana_access_token');
    localStorage.removeItem('kosana_refresh_token');
    window.location.href = '/login';
    throw e;
  } finally { isRefreshing = false; }
}

async function fetchAPI<T>(endpoint: string, options?: RequestInit & { _retry?: boolean }): Promise<T> {
  const token = getToken();
  const cleanEndpoint = normalizeEndpoint(endpoint);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...((options?.headers as Record<string, string>) || {})
  };
  const url = `${API_BASE_URL}${cleanEndpoint}`;
  const response = await fetch(url, { ...options, headers });

  if (response.status === 401 && !(options as any)?._retry) {
    const hasRefresh = localStorage.getItem('kosana_refresh_token');
    if (!hasRefresh) {
      localStorage.removeItem('kosana_token');
      localStorage.removeItem('kosana_access_token');
      window.location.href = '/login';
      throw new Error('Session expired');
    }
    try {
      const newToken = await refreshAccessToken();
      return fetchAPI<T>(endpoint, { ...options, _retry: true, headers: { ...((options?.headers as Record<string, string>) || {}), 'Authorization': `Bearer ${newToken}`, 'Content-Type': 'application/json' } } as any);
    } catch { throw new Error('Session expired'); }
  }
  if (response.status === 403) throw new Error('You do not have permission to perform this action.');
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error((error as any).error || `HTTP ${response.status}`);
  }
  if (response.status === 204) return undefined as T;
  return response.json();
}

// Generic axios-like wrapper used by Users.tsx / Roles.tsx
export const api = {
  get: <T>(url: string): Promise<{ data: T }> => fetchAPI<T>(url).then(data => ({ data } as any)),
  post: <T>(url: string, body?: any): Promise<{ data: T }> => fetchAPI<T>(url, { method: 'POST', body: body ? JSON.stringify(body) : undefined }).then(data => ({ data } as any)),
  put: <T>(url: string, body?: any): Promise<{ data: T }> => fetchAPI<T>(url, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }).then(data => ({ data } as any)),
  delete: <T>(url: string): Promise<{ data: T }> => fetchAPI<T>(url, { method: 'DELETE' }).then(data => ({ data } as any)),
};

export const dashboardAPI = { getStats: (): Promise<any> => fetchAPI('/dashboard/stats') };
export const propertiesAPI = {
  getAll: (): Promise<any[]> => fetchAPI('/properties'),
  getById: (id: string): Promise<any> => fetchAPI(`/properties/${id}`),
  create: (data: any): Promise<any> => fetchAPI('/properties', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any): Promise<any> => fetchAPI(`/properties/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string): Promise<void> => fetchAPI(`/properties/${id}`, { method: 'DELETE' }),
};
export const roomsAPI = {
  getAll: (propertyId?: string): Promise<any[]> => fetchAPI(`/rooms${propertyId ? `?propertyId=${propertyId}` : ''}`),
  getById: (id: string): Promise<any> => fetchAPI(`/rooms/${id}`),
  create: (data: any): Promise<any> => fetchAPI('/rooms', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any): Promise<any> => fetchAPI(`/rooms/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string): Promise<void> => fetchAPI(`/rooms/${id}`, { method: 'DELETE' }),
};
export const tenantsAPI = {
  getAll: (status?: string): Promise<any[]> => fetchAPI(`/tenants${status ? `?status=${status}` : ''}`),
  getById: (id: string): Promise<any> => fetchAPI(`/tenants/${id}`),
  create: (data: any): Promise<any> => fetchAPI('/tenants', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any): Promise<any> => fetchAPI(`/tenants/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string): Promise<void> => fetchAPI(`/tenants/${id}`, { method: 'DELETE' }),
};
export const paymentsAPI = {
  getAll: (params?: { status?: string; tenantId?: string }): Promise<any[]> => {
    const query = params ? new URLSearchParams(params as Record<string, string>).toString() : '';
    return fetchAPI(`/payments${query ? `?${query}` : ''}`);
  },
  getById: (id: string): Promise<any> => fetchAPI(`/payments/${id}`),
  create: (data: any): Promise<any> => fetchAPI('/payments', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any): Promise<any> => fetchAPI(`/payments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string): Promise<void> => fetchAPI(`/payments/${id}`, { method: 'DELETE' }),
  markPaid: (id: string): Promise<any> => fetchAPI(`/payments/${id}/mark-paid`, { method: 'POST' }),
};
export const expensesAPI = {
  getAll: (params?: { propertyId?: string; category?: string }): Promise<any[]> => {
    const query = params ? new URLSearchParams(params as Record<string, string>).toString() : '';
    return fetchAPI(`/expenses${query ? `?${query}` : ''}`);
  },
  getById: (id: string): Promise<any> => fetchAPI(`/expenses/${id}`),
  create: (data: any): Promise<any> => fetchAPI('/expenses', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any): Promise<any> => fetchAPI(`/expenses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string): Promise<void> => fetchAPI(`/expenses/${id}`, { method: 'DELETE' }),
  approve: (id: string, approvedBy: string): Promise<any> => fetchAPI(`/expenses/${id}/approve`, { method: 'POST', body: JSON.stringify({ approvedBy }) }),
  reject: (id: string, approvedBy: string): Promise<any> => fetchAPI(`/expenses/${id}/reject`, { method: 'POST', body: JSON.stringify({ approvedBy }) }),
};
export const roomCleaningAPI = {
  getAll: (propertyId: string, weekStart: string): Promise<RoomCleaningSchedule[]> => fetchAPI(`/room-cleaning?propertyId=${propertyId}&weekStart=${weekStart}`),
  getById: (id: string): Promise<RoomCleaningSchedule> => fetchAPI(`/room-cleaning/${id}`),
  create: (data: Partial<RoomCleaningSchedule>): Promise<RoomCleaningSchedule> => fetchAPI('/room-cleaning', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<RoomCleaningSchedule>): Promise<RoomCleaningSchedule> => fetchAPI(`/room-cleaning/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  start: (id: string): Promise<RoomCleaningSchedule> => fetchAPI(`/room-cleaning/${id}/start`, { method: 'POST' }),
  complete: (id: string, notes?: string, actual_duration?: number): Promise<RoomCleaningSchedule> => fetchAPI(`/room-cleaning/${id}/complete`, { method: 'POST', body: JSON.stringify({ notes, actual_duration }) }),
  skip: (id: string, reason: string): Promise<RoomCleaningSchedule> => fetchAPI(`/room-cleaning/${id}/skip`, { method: 'POST', body: JSON.stringify({ reason }) }),
  delete: (id: string): Promise<void> => fetchAPI(`/room-cleaning/${id}`, { method: 'DELETE' }),
  generate: (propertyId: string, weekStart: string): Promise<{ message: string; count: number }> => fetchAPI('/room-cleaning/generate', { method: 'POST', body: JSON.stringify({ propertyId, weekStart }) }),
  getSlots: (propertyId: string, weekStart: string): Promise<any[]> => fetchAPI(`/room-cleaning/slots?propertyId=${propertyId}&weekStart=${weekStart}`),
  getStats: (propertyId: string, weekStart: string): Promise<CleaningStats> => fetchAPI(`/room-cleaning/stats?propertyId=${propertyId}&weekStart=${weekStart}`),
  getRoomHistory: (roomId: string): Promise<RoomCleaningSchedule[]> => fetchAPI(`/room-cleaning/room/${roomId}/history`),
};
export const laundryAPI = {
  getAll: (status?: string): Promise<any[]> => fetchAPI(`/laundry${status ? `?status=${status}` : ''}`),
  getById: (id: string): Promise<any> => fetchAPI(`/laundry/${id}`),
  create: (data: any): Promise<any> => fetchAPI('/laundry', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any): Promise<any> => fetchAPI(`/laundry/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string): Promise<void> => fetchAPI(`/laundry/${id}`, { method: 'DELETE' }),
  complete: (id: string, completedBy: string): Promise<any> => fetchAPI(`/laundry/${id}/complete`, { method: 'POST', body: JSON.stringify({ completedBy }) }),
};
export const maintenanceAPI = {
  getAll: (status?: string): Promise<any[]> => fetchAPI(`/maintenance${status ? `?status=${status}` : ''}`),
  getById: (id: string): Promise<any> => fetchAPI(`/maintenance/${id}`),
  create: (data: any): Promise<any> => fetchAPI('/maintenance', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any): Promise<any> => fetchAPI(`/maintenance/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string): Promise<void> => fetchAPI(`/maintenance/${id}`, { method: 'DELETE' }),
  complete: (id: string, data: any): Promise<any> => fetchAPI(`/maintenance/${id}/complete`, { method: 'POST', body: JSON.stringify(data) }),
  assign: (id: string, assignedTo: string): Promise<any> => fetchAPI(`/maintenance/${id}/assign`, { method: 'POST', body: JSON.stringify({ assignedTo }) }),
};
export const acCleaningAPI = {
  getAll: (status?: string): Promise<any[]> => fetchAPI(`/ac-cleaning${status ? `?status=${status}` : ''}`),
  getById: (id: string): Promise<any> => fetchAPI(`/ac-cleaning/${id}`),
  create: (data: any): Promise<any> => fetchAPI('/ac-cleaning', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any): Promise<any> => fetchAPI(`/ac-cleaning/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string): Promise<void> => fetchAPI(`/ac-cleaning/${id}`, { method: 'DELETE' }),
  complete: (id: string, data: any): Promise<any> => fetchAPI(`/ac-cleaning/${id}/complete`, { method: 'POST', body: JSON.stringify(data) }),
};
export const notificationsAPI = {
  getAll: (userId?: string, unreadOnly?: boolean): Promise<any[]> => {
    let query = '';
    if (userId) { const params = new URLSearchParams({ userId }); if (unreadOnly) params.append('unreadOnly', 'true'); query = `?${params.toString()}`; }
    return fetchAPI(`/notifications${query}`);
  },
  create: (data: any): Promise<any> => fetchAPI('/notifications', { method: 'POST', body: JSON.stringify(data) }),
  markRead: (id: string): Promise<any> => fetchAPI(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllRead: (userId: string): Promise<any> => fetchAPI('/notifications/mark-all-read', { method: 'PUT', body: JSON.stringify({ userId }) }),
};
export const settingsAPI = {
  get: (): Promise<any> => fetchAPI('/settings'),
  update: (data: any, updatedBy: string): Promise<any> => fetchAPI('/settings', { method: 'PUT', body: JSON.stringify({ ...data, updatedBy }) }),
  updateSingle: (key: string, value: any, type: string, updatedBy: string): Promise<any> => fetchAPI(`/settings/${key}`, { method: 'PUT', body: JSON.stringify({ value, type, updatedBy }) }),
};
export const reportsAPI = {
  getRevenue: (): Promise<any[]> => fetchAPI('/reports/revenue'),
  getOccupancy: (): Promise<any[]> => fetchAPI('/reports/occupancy'),
  getExpensesByCategory: (): Promise<any[]> => fetchAPI('/reports/expenses-by-category'),
};

// Step 6 - FIXED: use /users not /api/users
export const usersAPI = {
  getAll: (): Promise<any[]> => fetchAPI('/users'),
  getSimple: (): Promise<any[]> => fetchAPI('/users/simple'),
  getById: (id: string): Promise<any> => fetchAPI(`/users/${id}`),
  create: (data: any): Promise<any> => fetchAPI('/users', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any): Promise<any> => fetchAPI(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  setStatus: (id: string, is_active: boolean): Promise<any> => fetchAPI(`/users/${id}/status`, { method: 'PUT', body: JSON.stringify({ is_active }) }),
  resetPassword: (id: string, new_password: string): Promise<any> => fetchAPI(`/users/${id}/reset-password`, { method: 'POST', body: JSON.stringify({ new_password }) }),
  setAssignments: (id: string, assignments: { propertyId: string; roleId: string; isOwner?: boolean }[]): Promise<any> => fetchAPI(`/users/${id}/assignments`, { method: 'PUT', body: JSON.stringify(assignments) }),
  revokeSessions: (id: string): Promise<any> => fetchAPI(`/auth/revoke/${id}`, { method: 'POST' }),
};

export const rolesAPI = {
  getAll: (): Promise<{ roles: any[]; allPermissions: any[]; modules: string[] }> => fetchAPI('/roles'),
};

export default { fetchAPI, api };
