import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  applyTheme,
  getSystemTheme,
  persistThemeMode,
  readStoredThemeMode,
  resolveTheme,
} from './themeMode';

const ThemeContext = createContext(null);

/**
 * Sumber tunggal tema aplikasi (Terang / Malam / Ikuti Sistem).
 * Preferensi disimpan di localStorage; pilihan "system" ikut berubah bila
 * pengaturan sistem operasi berubah.
 */
export const ThemeProvider = ({ children }) => {
  const [mode, setMode] = useState(readStoredThemeMode);
  const [systemTheme, setSystemTheme] = useState(getSystemTheme);

  const theme = mode === 'system' ? systemTheme : mode;

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (event) => setSystemTheme(event.matches ? 'dark' : 'light');

    if (typeof query.addEventListener === 'function') {
      query.addEventListener('change', onChange);
      return () => query.removeEventListener('change', onChange);
    }
    query.addListener(onChange);
    return () => query.removeListener(onChange);
  }, []);

  const updateMode = useCallback((nextMode) => {
    setMode(nextMode);
    persistThemeMode(nextMode);
  }, []);

  const toggleTheme = useCallback(() => {
    updateMode(resolveTheme(mode) === 'dark' ? 'light' : 'dark');
  }, [mode, updateMode]);

  const value = useMemo(() => ({
    mode,
    theme,
    isDark: theme === 'dark',
    setMode: updateMode,
    toggleTheme,
  }), [mode, theme, updateMode, toggleTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

/** Fallback aman bila dipakai di luar provider (mis. di Storybook). */
export const useTheme = () => useContext(ThemeContext) || {
  mode: 'system',
  theme: 'light',
  isDark: false,
  setMode: () => {},
  toggleTheme: () => {},
};
