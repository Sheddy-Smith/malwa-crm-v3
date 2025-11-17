import { create } from 'zustand';

const useUiStore = create((set) => ({
  isSidebarOpen: true, // Default to open on desktop
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
}));

export default useUiStore;
