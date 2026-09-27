import { API_BASE_URL } from '../config/api';

const TOKEN_KEY = 'kosana_token';
const ACCESS_KEY = 'kosana_access_token';
const REFRESH_KEY = 'kosana_refresh_token';
const USER_KEY = 'kosana_user';

export interface PropertyScope {
  propertyId: string;
  role: string;
  isOwner?: boolean;
  permissions: string[];
}

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  fullName: string;
  full_name?: string;
  role: string;
  globalRole?: string;
  tokenVersion?: number;
  propertyScopes?: PropertyScope[];
  permissions?: string[];
  accessiblePropertyIds?: string[];
  isAdmin?: boolean;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  token: string;
  user: AuthUser;
  propertyScopes: PropertyScope[];
  permissions: string[];
}

// [STRIPPED 75 bytes] Token helpers - keep old names for backward compat
export const setToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(ACCESS_KEY, token);
};
export const getToken = (): string | null => {
  return localStorage.getItem(ACCESS_KEY) || localStorage.getItem(TOKEN_KEY);
};
export const removeToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
};
export const isAuthenticated = (): boolean => !!getToken();

// New helpers
export const getAccessToken = (): string | null => getToken();
export const getRefreshToken = (): string | null => localStorage.getItem(REFRESH_KEY);

export const setTokens = (accessToken: string, refreshToken: string) => {
  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(ACCESS_KEY, accessToken);
  localStorage.setItem(REFRESH_KEY, refreshToken);
};

// [STRIPPED 75 bytes] Login - uses fetch directly, no dependency on api.ts
export interface LoginCredentials { username: string; password: string; }

export const login = async (username: string, password: string): Promise<LoginResponse> => {
  // support both login(username, password) and login({username,password})
  if (typeof username === 'object') {
    const creds = username as unknown as LoginCredentials;
    password = creds.password;
    username = creds.username;
  }
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Login failed' }));
    throw new Error(err.error || 'Invalid credentials');
  }
  const data = await res.json();
  const access = data.accessToken || data.token;
  const refresh = data.refreshToken;
  if (access && refresh) setTokens(access, refresh);
  else if (access) setToken(access);
  return {
    accessToken: access,
    refreshToken: refresh,
    token: access,
    user: data.user,
    propertyScopes: data.propertyScopes || [],
    permissions: data.permissions || []
  };
};

export const loginWithCreds = async (creds: LoginCredentials) => login(creds.username, creds.password);

// For service layer that calls authService.login
export const authService = {
  login: async (username: string, password: string): Promise<LoginResponse> => {
    return login(username, password);
  },
  refresh: async (): Promise<{ accessToken: string; refreshToken: string }> => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) throw new Error('No refresh token');
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });
    if (!res.ok) throw new Error('Refresh failed');
    const data = await res.json();
    const newAccess = data.accessToken || data.token;
    const newRefresh = data.refreshToken || refreshToken;
    setTokens(newAccess, newRefresh);
    return { accessToken: newAccess, refreshToken: newRefresh };
  },
  logout: async (): Promise<void> => {
    const token = getToken();
    try {
      if (token) {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }
    } catch {}
    removeToken();
  },
  logoutAll: async (): Promise<void> => {
    const token = getToken();
    try {
      if (token) {
        await fetch(`${API_BASE_URL}/auth/logout-all`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }
    } catch {}
    removeToken();
  },
  getCurrentUser: async (): Promise<AuthUser> => {
    const token = getToken();
    if (!token) {
      const err: any = new Error('No token');
      err.response = { status: 401 };
      throw err;
    }
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) {
      const err: any = new Error('Failed to get user');
      err.response = { status: res.status };
      if (res.status === 401 || res.status === 403) {
        removeToken();
      }
      throw err;
    }
    return res.json();
  },
  getAccessToken,
  getRefreshToken,
  isAuthenticated
};

// Keep legacy functions
export const register = async (data: any): Promise<LoginResponse> => {
  const res = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Registration failed' }));
    throw new Error(err.error);
  }
  const result = await res.json();
  const access = result.token || result.accessToken;
  if (access) setToken(access);
  return result;
};

export const logout = (): void => {
  removeToken();
  window.location.href = '/login';
};

export const getCurrentUser = authService.getCurrentUser;

export const changePassword = async (currentPassword: string, newPassword: string): Promise<void> => {
  const token = getToken();
  if (!token) throw new Error('Not authenticated');
  const res = await fetch(`${API_BASE_URL}/auth/change-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ currentPassword, newPassword })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed' }));
    throw new Error(err.error);
  }
};

const decodeJwtPayload = (token: string): any | null => {
  try {
    const payloadBase64 = token.split('.')[1];
    const payloadJson = atob(payloadBase64);
    return JSON.parse(payloadJson);
  } catch {
    return null;
  }
};

export const getUserFromToken = (): AuthUser | null => {
  const token = getToken();
  if (!token) return null;
  const payload = decodeJwtPayload(token);
  if (!payload) return null;
  return {
    id: payload.userId || payload.id,
    username: payload.username || '',
    email: payload.email || '',
    fullName: payload.fullName || payload.username || '',
    role: payload.globalRole || payload.role || '',
    globalRole: payload.globalRole || payload.role || ''
  };
};

export const syncUserFromToken = (): void => {
  const user = getUserFromToken();
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
};