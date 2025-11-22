import { useCallback } from 'react';
import usePermissionStore from '@/store/permissionStore';

/**
 * Hook for checking user permissions in components
 * @returns {Object} Permission check functions
 */
export const usePermissions = () => {
  const { permissions, can, canAny, canAll, canAccessRoute, loading, initialized } = usePermissionStore();

  const checkPermission = useCallback((permissionCode) => {
    return can(permissionCode);
  }, [can]);

  const checkAnyPermission = useCallback((permissionCodes) => {
    return canAny(permissionCodes);
  }, [canAny]);

  const checkAllPermissions = useCallback((permissionCodes) => {
    return canAll(permissionCodes);
  }, [canAll]);

  const checkRouteAccess = useCallback((route) => {
    return canAccessRoute(route);
  }, [canAccessRoute]);

  return {
    permissions,
    can: checkPermission,
    canAny: checkAnyPermission,
    canAll: checkAllPermissions,
    canAccessRoute: checkRouteAccess,
    loading,
    initialized,
  };
};

export default usePermissions;
