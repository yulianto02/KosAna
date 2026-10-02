// app/src/components/ProtectedRoute.tsx - Step 8 FIX: Support array permissions + OR logic for penjaga
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  permission?: string | string[]; // Step 8: support array for penjaga (view OR create)
  permissions?: string[]; // alternative prop name
  requireAdmin?: boolean;
}

export function ProtectedRoute({ children, permission, permissions, requireAdmin = false }: ProtectedRouteProps) {
  const { hasPermission, isAdmin, user, loading } = useAuth() as any;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin w-8 h-8 border-2 border-[#1A3D5C] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !isAdmin) {
    console.warn('[ProtectedRoute] Admin required, redirecting to /dashboard');
    return <Navigate to="/dashboard" replace />;
  }

  // Step 8: Build list of required permissions (support both props)
  const requiredList: string[] = [];
  if (permission) {
    if (Array.isArray(permission)) requiredList.push(...permission);
    else requiredList.push(permission);
  }
  if (permissions) {
    requiredList.push(...permissions);
  }

  if (requiredList.length > 0) {
    // OR logic: allow if user has ANY of the listed permissions
    // This allows penjaga with expenses.create to access expenses page that requires view
    const hasAny = requiredList.some(p => hasPermission(p));
    
    if (!hasAny) {
      // Special future-proof mapping for penjaga:
      // expenses.view <-> expenses.create, ac_cleaning.view <-> ac_cleaning.schedule/create, etc.
      const role = (user?.role || user?.globalRole || '').toLowerCase();
      const isPenjaga = role.includes('penjaga');
      
      console.warn(`[ProtectedRoute] No permission ${requiredList.join(' OR ')} for user ${user?.username} (${role}), redirecting to /dashboard`);
      
      // For penjaga, redirect to first allowed page, not dashboard (which he doesn't have)
      if (isPenjaga) {
        return <Navigate to="/properties" replace />;
      }
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
}
