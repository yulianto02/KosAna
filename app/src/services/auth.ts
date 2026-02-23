import { API_BASE_URL } from '../config/api';
// Remove the local const definition
// const API_BASE_URL = 'http://localhost:3001/api';

// Token management
export const setToken = (token: string): void => {
  localStorage.setItem('kosana_token', token);
};

export const getToken = (): string | null => {
  return localStorage.getItem('kosana_token');
};

export const removeToken = (): void => {
  localStorage.removeItem('kosana_token');
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  return !!getToken();
};

// Login
export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    username: string;
    email: string;
    fullName: string;
    role: string;
  };
}

export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Login failed' }));
    throw new Error(error.error || 'Invalid credentials');
  }
  
  const data: AuthResponse = await response.json();
  setToken(data.token);
  return data;
};

// Register
export interface RegisterData {
  username: string;
  password: string;
  email: string;
  phone: string;
  fullName: string;
  role?: string;
}

export const register = async (data: RegisterData): Promise<AuthResponse> => {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Registration failed' }));
    throw new Error(error.error || 'Registration failed');
  }
  
  const result: AuthResponse = await response.json();
  setToken(result.token);
  return result;
};

// Logout
export const logout = (): void => {
  removeToken();
  window.location.href = '/login';
};

// Get current user

// Get current user
export const getCurrentUser = async (): Promise<AuthResponse['user']> => {
  const token = getToken();
  if (!token) {
    const error = new Error('No token found') as any;
    error.response = { status: 401 };
    throw error;
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      // Create error with status code for Layout.tsx to handle
      const error = new Error('Failed to get user') as any;
      error.response = { status: response.status };
      
      if (response.status === 401 || response.status === 403) {
        // Clear invalid token
        removeToken();
        localStorage.removeItem('kosana_user');
        error.message = 'Session expired';
      }
      
      throw error;
    }
    
    return await response.json();
  } catch (error: any) {
    // If it's already our custom error with status, re-throw it
    if (error.response?.status) {
      throw error;
    }
    // For network errors or other issues, create a generic error
    const networkError = new Error('Failed to get user') as any;
    networkError.response = { status: 500 };
    throw networkError;
  }
};

// Change password
export const changePassword = async (currentPassword: string, newPassword: string): Promise<void> => {
  const token = getToken();
  if (!token) throw new Error('Not authenticated');
  
  const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to change password' }));
    throw new Error(error.error);
  }
};

// Tambahkan ini di src/services/auth.ts

// Helper to decode JWT payload (safe for public claims)
const decodeJwtPayload = (token: string): any | null => {
  try {
    const payloadBase64 = token.split('.')[1];
    const payloadJson = atob(payloadBase64);
    return JSON.parse(payloadJson);
  } catch (error) {
    console.error('Gagal decode JWT token:', error);
    return null;
  }
};

// Get full user object from token (centralized & reusable)
export const getUserFromToken = (): AuthResponse['user'] | null => {
  const token = getToken();
  if (!token) return null;

  const payload = decodeJwtPayload(token);
  if (!payload?.id) return null;

  return {
    id: payload.id,
    username: payload.username || '',
    email: payload.email || '',
    fullName: payload.fullName || payload.username || '',
    role: payload.role || '',
  };
};

// Optional: Sync user to localStorage if token exists (useful on page refresh)
export const syncUserFromToken = (): void => {
  const user = getUserFromToken();
  if (user) {
    localStorage.setItem('user', JSON.stringify(user));
  }
};