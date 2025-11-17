import { create } from 'zustand';
import { dbOperations } from '@/lib/db';
import { toast } from 'sonner';

const useUserManagementStore = create((set) => ({
  users: [],
  branches: [],
  loading: false,

  fetchUsers: async () => {
    try {
      set({ loading: true });
      const data = await dbOperations.getAll('profiles');
      set({ users: data || [], loading: false });
    } catch (error) {
      console.error('Error fetching users:', error);
      set({ loading: false });
    }
  },

  fetchBranches: async () => {
    try {
      const data = await dbOperations.getAll('branches');
      set({ branches: data || [] });
    } catch (error) {
      console.error('Error fetching branches:', error);
    }
  },

  addUser: async (user) => {
    try {
      const data = await dbOperations.insert('profiles', {
        name: user.name,
        email: user.email,
        role: user.role,
        branch_id: user.branch_id || null,
        status: 'Active',
        permissions: user.permissions || {
          dashboard: 'full',
          jobs: 'full',
          customer: 'full',
          vendors: 'full',
          labour: 'full',
          supplier: 'full',
          inventory: 'full',
          accounts: 'full',
          summary: 'view',
          settings: 'none'
        }
      });

      set((state) => ({ users: [...state.users, data] }));
      toast.success('User added successfully');
      return data;
    } catch (error) {
      console.error('Error adding user:', error);
      toast.error('Failed to add user');
      throw error;
    }
  },

  updateUser: async (updatedUser) => {
    try {
      await dbOperations.update('profiles', updatedUser.id, updatedUser);
      set((state) => ({
        users: state.users.map((u) => u.id === updatedUser.id ? updatedUser : u),
      }));
      toast.success('User updated successfully');
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user');
      throw error;
    }
  },

  deleteUser: async (userId) => {
    try {
      await dbOperations.delete('profiles', userId);
      set((state) => ({
        users: state.users.filter((u) => u.id !== userId),
      }));
      toast.success('User deleted successfully');
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
      throw error;
    }
  },

  addBranch: async (branch) => {
    try {
      const data = await dbOperations.insert('branches', branch);
      set((state) => ({ branches: [...state.branches, data] }));
      toast.success('Branch added successfully');
      return data;
    } catch (error) {
      console.error('Error adding branch:', error);
      toast.error('Failed to add branch');
      throw error;
    }
  },

  updateBranch: async (updatedBranch) => {
    try {
      await dbOperations.update('branches', updatedBranch.id, updatedBranch);
      set((state) => ({
        branches: state.branches.map((b) => b.id === updatedBranch.id ? updatedBranch : b),
      }));
      toast.success('Branch updated successfully');
    } catch (error) {
      console.error('Error updating branch:', error);
      toast.error('Failed to update branch');
      throw error;
    }
  },

  deleteBranch: async (branchId) => {
    try {
      await dbOperations.delete('branches', branchId);
      set((state) => ({
        branches: state.branches.filter((b) => b.id !== branchId),
      }));
      toast.success('Branch deleted successfully');
    } catch (error) {
      console.error('Error deleting branch:', error);
      toast.error('Failed to delete branch');
      throw error;
    }
  },
}));

export default useUserManagementStore;
