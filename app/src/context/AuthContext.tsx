// app/src/context/AuthContext.tsx - REPLACE entirely
import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { authService } from '@/services/auth';
import type { AuthUser, PropertyScope } from '@/services/auth';

interface AuthContextType {
  user: AuthUser | null;
  propertyScopes: PropertyScope[];
  permissions: string[];
  accessiblePropertyIds: string[];
  isAdmin: boolean;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (perm: string) => boolean;
  canAccessProperty: (propertyId: string) => boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [propertyScopes, setPropertyScopes] = useState<PropertyScope[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [accessiblePropertyIds, setAccessiblePropertyIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const loadUser = async () => {
    setLoading(true);
    try {
      if (!authService.isAuthenticated()) {
        setUser(null);
        setPropertyScopes([]);
        setPermissions([]);
        setAccessiblePropertyIds([]);
        return;
      }
      const me: any = await authService.getCurrentUser();
      setUser(me);
      setPropertyScopes(me.propertyScopes || []);
      setPermissions(me.permissions || []);
      setAccessiblePropertyIds(me.accessiblePropertyIds || []);
    } catch (e) {
      console.error('AuthContext loadUser failed', e);
      // clear on failure to prevent stale token loop
      authService.logout();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUser(); }, []);

  const login = async (username: string, password: string) => {
    setLoading(true);
    await authService.login(username, password);
    // wait for me to be loaded before returning, so ProtectedRoute has permissions
    await loadUser();
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    setPropertyScopes([]);
    setPermissions([]);
    setAccessiblePropertyIds([]);
    setLoading(false);
  };

  const hasPermission = (perm: string) => {
    if (!user) return false;
    if ((user as any).isAdmin) return true;
    if (permissions.includes('*')) return true;
    // alias .view <-> .read
    if (permissions.includes(perm)) return true;
    const alt = perm.includes('.view') ? perm.replace('.view','.read') : perm.replace('.read','.view');
    return permissions.includes(alt);
  };

  const canAccessProperty = (propertyId: string) => {
    if (!user) return false;
    if ((user as any).isAdmin) return true;
    if (accessiblePropertyIds.includes('*')) return true;
    return accessiblePropertyIds.includes(propertyId);
  };

  return (
    <AuthContext.Provider value={{
      user, propertyScopes, permissions, accessiblePropertyIds,
      isAdmin: !!(user as any)?.isAdmin, loading, login, logout,
      hasPermission, canAccessProperty, refreshUser: loadUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};