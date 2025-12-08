// Dark mode support removed; provide a no-op context to avoid breaking legacy imports
'use client';

import React, { createContext, useContext } from 'react';

type Theme = 'light';

interface ThemeContextType {
  theme: Theme;
  effectiveTheme: Theme;
  setTheme: (_theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  effectiveTheme: 'light',
  setTheme: () => {},
  toggleTheme: () => {},
});

const defaultThemeValue: ThemeContextType = {
  theme: 'light',
  effectiveTheme: 'light',
  setTheme: () => {},
  toggleTheme: () => {},
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeContext.Provider value={defaultThemeValue}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
