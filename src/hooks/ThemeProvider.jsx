import { useEffect } from 'react';
import { useThemeStore } from '@/store/appStateStore';

export function ThemeProvider({ children }) {
  const theme = useThemeStore((state) => state.theme);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    // Safety check to ensure theme is a valid string
    const safeTheme = theme && typeof theme === 'string' ? theme : 'light';

    if (safeTheme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
      return;
    }

    // Only add valid string themes
    if (safeTheme && ['light', 'dark'].includes(safeTheme)) {
      root.classList.add(safeTheme);
    }
  }, [theme]);

  return <>{children}</>;
}
