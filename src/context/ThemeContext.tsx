'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  setTheme: () => {},
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [theme, setThemeState] = useState<ThemeMode>('light');

  // Dark mode is strictly restricted to /admin routes. The landing page / login page is ALWAYS white.
  const isAdminRoute = Boolean(pathname?.startsWith('/admin'));

  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('localfarm_theme') as ThemeMode | null;
      if (savedTheme === 'dark' || savedTheme === 'light') {
        setThemeState(savedTheme);
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;

    // Landing / Login page: MUST NEVER have dark mode. Always remain pure white.
    if (!isAdminRoute) {
      root.classList.remove('dark');
      return;
    }

    // Inside admin portal: apply the admin's theme preference
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme, isAdminRoute, pathname]);

  function setTheme(newTheme: ThemeMode) {
    setThemeState(newTheme);
    try {
      localStorage.setItem('localfarm_theme', newTheme);
    } catch {
      // Ignore
    }
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      if (isAdminRoute && newTheme === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }

  function toggleTheme() {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
