import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { isAuthenticated, getCurrentUser } from '@/services/auth';
import { useAuth } from '@/context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string[];
  permission?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole, permission }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [hasPerm, setHasPerm] = useState(true);
  const location = useLocation();
  let authCtx: any = null;
  try { authCtx = useAuth(); } catch { authCtx = null; }

  useEffect(() => {
    const checkAuth = async () => {
      if (!isAuthenticated()) {
        setIsAuthorized(false);
        setIsLoading(false);
        return;
      }
      try {
        const user: any = await getCurrentUser();
        if (!user) {
          // Fallback to authCtx user
          if (authCtx?.user) {
            setIsAuthorized(true);
            setIsLoading(false);
            return;
          }
          setIsAuthorized(false);
          setIsLoading(false);
          return;
        }
        if (requiredRole) {
          const roleOk = requiredRole.includes(user.role) || requiredRole.includes(user.globalRole) || user.isAdmin;
          if (!roleOk) {
            setIsAuthorized(false);
            setIsLoading(false);
            return;
          }
        }
        if (permission) {
          // Admin bypass
          if (user.isAdmin || user.permissions?.includes('*')) {
            setHasPerm(true);
          } else {
            // Use context hasPermission if available (more accurate for penjaga)
            if (authCtx?.hasPermission) {
              // Special handling: penjaga has no dashboard.view, but should see dashboard
              if (permission === 'dashboard.view' && (user.globalRole === 'penjaga' || user.role === 'penjaga')) {
                setHasPerm(true);
              } else {
                setHasPerm(authCtx.hasPermission(permission));
              }
            } else {
              const perms = user.permissions || [];
              // penjaga's permissions are like properties.read, not properties.view
              const altPerm = permission.includes('.view') ? permission.replace('.view', '.read') : permission.replace('.read', '.view');
              const ok = perms.includes(permission) || perms.includes(altPerm) || perms.includes('*') || (permission === 'dashboard.view'); // allow dashboard for all logged in
              setHasPerm(ok);
            }
          }
        }
        setIsAuthorized(true);
      } catch (e) {
        console.error('ProtectedRoute check failed', e);
        // If authCtx has user, still allow
        if (authCtx?.user) setIsAuthorized(true);
        else setIsAuthorized(false);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, [requiredRole, permission, authCtx?.user]);

  if (isLoading) return <div className="flex items-center justify-center h-screen">Loading...</div>;
  if (!isAuthorized) return <Navigate to="/login" replace />;
  if (permission && !hasPerm) {
    // Don't redirect penjaga from dashboard, show empty message instead of infinite loop
    if (location.pathname === '/dashboard' || permission === 'dashboard.view') {
      return <>{children}</>;
    }
    console.warn(`[ProtectedRoute] No permission ${permission} for user, redirecting to /dashboard`);
    return <Navigate to="/dashboard" replace state={{ from: location, noPermission: permission }} />;
  }
  return <>{children}</>;
};
