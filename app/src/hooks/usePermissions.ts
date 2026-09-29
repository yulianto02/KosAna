import { useAuth } from '@/context/AuthContext';

/**
 * Step 5 - usePermissions hook
 * Exposes can(permission) from AuthContext
 */
export function usePermissions() {
  const { hasPermission, permissions, isAdmin, user } = useAuth();

  const can = (permission: string): boolean => {
    if (!user) return false;
    if (isAdmin) return true;
    if (permissions.includes('*')) return true;
    return hasPermission(permission);
  };

  const cannot = (permission: string) => !can(permission);

  return { can, cannot, hasPermission: can, isAdmin, permissions };
}

export default usePermissions;
