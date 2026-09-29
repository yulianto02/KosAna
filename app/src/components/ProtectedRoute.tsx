import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { isAuthenticated, getCurrentUser } from '@/services/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string[];
  permission?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole,
  permission
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [hasPerm, setHasPerm] = useState(true);
  const location = useLocation();

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
          setIsAuthorized(false);
          setIsLoading(false);
          return;
        }

        // role check (legacy)
        if (requiredRole && !requiredRole.includes(user.role) && !requiredRole.includes(user.globalRole)) {
          // also check isAdmin bypass
          if (!user.isAdmin && user.globalRole !== 'admin') {
            setIsAuthorized(false);
            setIsLoading(false);
            return;
          }
        }

        // permission check - supports both *.view and *.read (your DB uses .read)
        if (permission) {
          if (user.isAdmin || user.permissions?.includes('*')) {
            setHasPerm(true);
          } else {
            const perms = user.permissions || [];
            // normalize: allow .view to satisfy .read and vice versa
            const normalizedPerm = permission.replace('.view', '.read').replace('.read', '.view');
            const altPerm = permission.includes('.view') ? permission.replace('.view','.read') : permission.replace('.read','.view');
            const ok = perms.includes(permission) || perms.includes(altPerm) || perms.includes(normalizedPerm);
            setHasPerm(ok);
          }
        }

        setIsAuthorized(true);
      } catch (e) {
        console.error('ProtectedRoute check failed', e);
        setIsAuthorized(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [requiredRole, permission]);

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!isAuthorized) {
    return <Navigate to="/login" replace />;
  }

  if (permission && !hasPerm) {
    return <Navigate to="/" replace state={{ from: location, noPermission: permission }} />;
  }

  return <>{children}</>;
};
