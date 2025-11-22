import { create } from 'zustand';
import { getUserPermissions } from '@/utils/permissionHelpers';
import usePermissionStore from './permissionStore';

const usePreviewStore = create((set, get) => ({
  // State
  isPreviewMode: false,
  originalPermissions: [],
  previewUser: null,

  // Actions
  startPreview: async (userId, userName) => {
    try {
      // Save original permissions
      const permissionStore = usePermissionStore.getState();
      const originalPerms = [...permissionStore.permissions];
      
      // Load preview user's permissions
      const previewPerms = await getUserPermissions(userId);
      
      // Update permission store with preview permissions
      permissionStore.permissions = previewPerms;
      
      set({
        isPreviewMode: true,
        originalPermissions: originalPerms,
        previewUser: { id: userId, name: userName },
      });
      
      return true;
    } catch (error) {
      console.error('Error starting preview:', error);
      return false;
    }
  },

  endPreview: () => {
    const { originalPermissions } = get();
    const permissionStore = usePermissionStore.getState();
    
    // Restore original permissions
    permissionStore.permissions = originalPermissions;
    
    set({
      isPreviewMode: false,
      originalPermissions: [],
      previewUser: null,
    });
  },
}));

export default usePreviewStore;
