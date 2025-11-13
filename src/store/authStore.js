import { create } from 'zustand';
import { authService } from '@/lib/auth';

const useAuthStore = create((set, get) => ({
  isAuthenticated: false,
  user: null,
  profile: null,
  loading: false,

  initialize: async () => {
    const user = await authService.getUser();
    const profile = await authService.getProfile();

    set({
      isAuthenticated: !!user,
      user,
      profile
    });
  },

  login: async (email, password) => {
    set({ loading: true });
    try {
      const { user, profile, error } = await authService.signIn({ email, password });

      if (error) {
        set({ loading: false });
        return false;
      }

      set({
        isAuthenticated: true,
        user,
        profile,
        loading: false
      });

      return true;
    } catch (error) {
      console.error('Login error:', error);
      set({ loading: false });
      return false;
    }
  },

  logout: async () => {
    await authService.signOut();
    set({
      isAuthenticated: false,
      user: null,
      profile: null
    });
  },

  updateProfile: async (updates) => {
    const currentProfile = get().profile;
    if (!currentProfile) return;

    set({ profile: { ...currentProfile, ...updates } });
  }
}));

export default useAuthStore;
