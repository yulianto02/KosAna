// API Service for Kos Ana
import type { Property, Room, Tenant, Payment, Expense, LaundryOrder, MaintenanceRequest, ACCleaningSchedule } from '@/types';

const API_BASE_URL = 'http://localhost:3001/api';

// Generic fetch wrapper
async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }
  
  return response.json();
}

// ==================== DASHBOARD ====================
export const dashboardAPI = {
  getStats: (): Promise<any> => fetchAPI('/dashboard/stats'),
};

// ==================== PROPERTIES ====================
export const propertiesAPI = {
  getAll: (): Promise<Property[]> => fetchAPI('/properties'),
  getById: (id: string): Promise<Property> => fetchAPI(`/properties/${id}`),
  create: (data: any): Promise<Property> => fetchAPI('/properties', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: any): Promise<Property> => fetchAPI(`/properties/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: string): Promise<void> => fetchAPI(`/properties/${id}`, {
    method: 'DELETE',
  }),
};

// ==================== ROOMS ====================
export const roomsAPI = {
  getAll: (propertyId?: string): Promise<Room[]> => fetchAPI(`/rooms${propertyId ? `?propertyId=${propertyId}` : ''}`),
  getById: (id: string): Promise<Room> => fetchAPI(`/rooms/${id}`),
  create: (data: any): Promise<Room> => fetchAPI('/rooms', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: any): Promise<Room> => fetchAPI(`/rooms/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: string): Promise<void> => fetchAPI(`/rooms/${id}`, {
    method: 'DELETE',
  }),
};

// ==================== TENANTS ====================
export const tenantsAPI = {
  getAll: (status?: string): Promise<Tenant[]> => fetchAPI(`/tenants${status ? `?status=${status}` : ''}`),
  getById: (id: string): Promise<Tenant> => fetchAPI(`/tenants/${id}`),
  create: (data: any): Promise<Tenant> => fetchAPI('/tenants', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: any): Promise<Tenant> => fetchAPI(`/tenants/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: string): Promise<void> => fetchAPI(`/tenants/${id}`, {
    method: 'DELETE',
  }),
};

// ==================== PAYMENTS ====================
export const paymentsAPI = {
  getAll: (params?: { status?: string; tenantId?: string }): Promise<Payment[]> => {
    const query = params ? new URLSearchParams(params as Record<string, string>).toString() : '';
    return fetchAPI(`/payments${query ? `?${query}` : ''}`);
  },
  getById: (id: string): Promise<Payment> => fetchAPI(`/payments/${id}`),
  create: (data: any): Promise<Payment> => fetchAPI('/payments', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: any): Promise<Payment> => fetchAPI(`/payments/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: string): Promise<void> => fetchAPI(`/payments/${id}`, {
    method: 'DELETE',
  }),
  markPaid: (id: string): Promise<Payment> => fetchAPI(`/payments/${id}/mark-paid`, {
    method: 'POST',
  }),
};

// ==================== EXPENSES ====================
export const expensesAPI = {
  getAll: (params?: { propertyId?: string; category?: string }): Promise<Expense[]> => {
    const query = params ? new URLSearchParams(params as Record<string, string>).toString() : '';
    return fetchAPI(`/expenses${query ? `?${query}` : ''}`);
  },
  getById: (id: string): Promise<Expense> => fetchAPI(`/expenses/${id}`),
  create: (data: any): Promise<Expense> => fetchAPI('/expenses', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: any): Promise<Expense> => fetchAPI(`/expenses/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: string): Promise<void> => fetchAPI(`/expenses/${id}`, {
    method: 'DELETE',
  }),
};

// ==================== LAUNDRY ====================
export const laundryAPI = {
  getAll: (status?: string): Promise<LaundryOrder[]> => fetchAPI(`/laundry${status ? `?status=${status}` : ''}`),
  getById: (id: string): Promise<LaundryOrder> => fetchAPI(`/laundry/${id}`),
  create: (data: any): Promise<LaundryOrder> => fetchAPI('/laundry', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: any): Promise<LaundryOrder> => fetchAPI(`/laundry/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: string): Promise<void> => fetchAPI(`/laundry/${id}`, {
    method: 'DELETE',
  }),
  complete: (id: string): Promise<LaundryOrder> => fetchAPI(`/laundry/${id}/complete`, {
    method: 'POST',
  }),
};

// ==================== MAINTENANCE ====================
export const maintenanceAPI = {
  getAll: (status?: string): Promise<MaintenanceRequest[]> => fetchAPI(`/maintenance${status ? `?status=${status}` : ''}`),
  getById: (id: string): Promise<MaintenanceRequest> => fetchAPI(`/maintenance/${id}`),
  create: (data: any): Promise<MaintenanceRequest> => fetchAPI('/maintenance', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: any): Promise<MaintenanceRequest> => fetchAPI(`/maintenance/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: string): Promise<void> => fetchAPI(`/maintenance/${id}`, {
    method: 'DELETE',
  }),
  complete: (id: string): Promise<MaintenanceRequest> => fetchAPI(`/maintenance/${id}/complete`, {
    method: 'POST',
  }),
};

// ==================== AC CLEANING ====================
export const acCleaningAPI = {
  getAll: (status?: string): Promise<ACCleaningSchedule[]> => fetchAPI(`/ac-cleaning${status ? `?status=${status}` : ''}`),
  getById: (id: string): Promise<ACCleaningSchedule> => fetchAPI(`/ac-cleaning/${id}`),
  create: (data: any): Promise<ACCleaningSchedule> => fetchAPI('/ac-cleaning', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: any): Promise<ACCleaningSchedule> => fetchAPI(`/ac-cleaning/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: string): Promise<void> => fetchAPI(`/ac-cleaning/${id}`, {
    method: 'DELETE',
  }),
  complete: (id: string): Promise<ACCleaningSchedule> => fetchAPI(`/ac-cleaning/${id}/complete`, {
    method: 'POST',
  }),
};

// ==================== NOTIFICATIONS ====================
export const notificationsAPI = {
  getAll: (): Promise<any[]> => fetchAPI('/notifications'),
  create: (data: any): Promise<any> => fetchAPI('/notifications', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  markRead: (id: string): Promise<any> => fetchAPI(`/notifications/${id}/read`, {
    method: 'PUT',
  }),
};

// ==================== SETTINGS ====================
export const settingsAPI = {
  get: (): Promise<any> => fetchAPI('/settings'),
  update: (data: any): Promise<any> => fetchAPI('/settings', {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
};

// ==================== REPORTS ====================
export const reportsAPI = {
  getRevenue: (): Promise<any[]> => fetchAPI('/reports/revenue'),
  getOccupancy: (): Promise<any[]> => fetchAPI('/reports/occupancy'),
  getExpensesByCategory: (): Promise<any[]> => fetchAPI('/reports/expenses-by-category'),
};
