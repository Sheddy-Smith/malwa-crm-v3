import { create } from 'zustand';
import { getUserPermissions, saveUserPermissions, hasPermission, hasAnyPermission } from '@/utils/permissionHelpers';

const usePermissionStore = create((set, get) => ({
  // State
  permissions: [],
  loading: false,
  initialized: false,

  // Actions
  loadPermissions: async (userId) => {
    if (!userId) {
      set({ permissions: [], loading: false, initialized: true });
      return;
    }

    set({ loading: true });
    try {
      const userPermissions = await getUserPermissions(userId);
      set({ permissions: userPermissions, loading: false, initialized: true });
    } catch (error) {
      console.error('Error loading permissions:', error);
      set({ permissions: [], loading: false, initialized: true });
    }
  },

  updatePermissions: async (userId, newPermissions, actorId = null) => {
    try {
      const success = await saveUserPermissions(userId, newPermissions, actorId);
      if (success) {
        // If updating current user's permissions, reload them
        set({ permissions: newPermissions });
      }
      return success;
    } catch (error) {
      console.error('Error updating permissions:', error);
      return false;
    }
  },

  clearPermissions: () => {
    set({ permissions: [], loading: false, initialized: false });
  },

  // Permission check methods (using state)
  can: (permissionCode) => {
    const { permissions } = get();
    return hasPermission(permissions, permissionCode);
  },

  canAny: (permissionCodes) => {
    const { permissions } = get();
    return hasAnyPermission(permissions, permissionCodes);
  },

  canAll: (permissionCodes) => {
    const { permissions } = get();
    return permissionCodes.every(code => hasPermission(permissions, code));
  },

  // Check if user has access to a route
  canAccessRoute: (route) => {
    const { permissions } = get();
    
    // Define route to permission mapping
    const routePermissions = {
      '/dashboard': 'DASHBOARD_VIEW',
      '/jobs': 'JOBS_VIEW',
      '/customer': 'CUSTOMER_VIEW',
      '/vendors': 'VENDOR_VIEW',
      '/labour': 'LABOUR_VIEW',
      '/supplier': 'SUPPLIER_VIEW',
      '/inventory': 'INVENTORY_VIEW',
      '/accounts': 'ACCOUNTS_VIEW',
      '/summary': 'SUMMARY_VIEW',
      '/daily-tasks': 'DAILY_TASKS_VIEW',
      '/settings': 'SETTINGS_VIEW',
    };
    
    // Find matching route
    const matchingRoute = Object.keys(routePermissions).find(r => route.startsWith(r));
    if (!matchingRoute) return true; // Allow unknown routes by default
    
    const requiredPermission = routePermissions[matchingRoute];
    return hasPermission(permissions, requiredPermission);
  },
}));

export default usePermissionStore;
