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
    const onChange = (event) => {
      const nextSystem = event.matches ? 'dark' : 'light';
      setSystemTheme(nextSystem);
      if (mode === 'system') applyTheme(nextSystem);
    };

    if (typeof query.addEventListener === 'function') {
      query.addEventListener('change', onChange);
      return () => query.removeEventListener('change', onChange);
    }
    query.addListener(onChange);
    return () => query.removeListener(onChange);
  }, [mode]);

  const updateMode = useCallback((nextMode) => {
    setMode(nextMode);
    persistThemeMode(nextMode);
    applyTheme(resolveTheme(nextMode));
  }, []);

  const toggleTheme = useCallback(() => {
    const nextTheme = resolveTheme(mode) === 'dark' ? 'light' : 'dark';
    updateMode(nextTheme);
  }, [mode, updateMode]);

  const value = useMemo(
    () => ({
      mode,
      theme,
      isDark: theme === 'dark',
      setMode: updateMode,
      toggleTheme,
    }),
    [mode, theme, updateMode, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

/** Fallback aman bila dipakai di luar provider (mis. di Storybook). */
export const useTheme = () =>
  useContext(ThemeContext) || {
    mode: 'system',
    theme: 'light',
    isDark: false,
    setMode: () => {},
    toggleTheme: () => {},
  };
