/* Helper tema murni (tanpa React) — dipakai ThemeProvider dan skrip anti-kedip
   di index.html. Dipisah agar mudah diuji dan tidak menyeret dependensi. */

const THEME_STORAGE_KEY = 'wb_theme';

const THEME_MODES = ['light', 'dark', 'system'];

export const getSystemTheme = () => {
  if (typeof window === 'undefined' || !window.matchMedia) return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export const readStoredThemeMode = () => {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return THEME_MODES.includes(stored) ? stored : 'system';
  } catch {
    return 'system';
  }
};

export const persistThemeMode = (mode) => {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, mode);
  } catch {
    /* mode privat / storage penuh — abaikan, tema tetap berlaku untuk sesi ini */
  }
};

/** Ubah preferensi ('light' | 'dark' | 'system') menjadi tema efektif. */
export const resolveTheme = (mode) => (mode === 'system' ? getSystemTheme() : mode);

/** Pasang tema ke <html>: kelas `dark`, atribut data-theme, dan color-scheme. */
export const applyTheme = (theme) => {
  if (typeof document === 'undefined') return;
  const isDark = theme === 'dark';
  const root = document.documentElement;

  root.classList.toggle('dark', isDark);
  root.dataset.theme = isDark ? 'dark' : 'light';
  root.style.colorScheme = isDark ? 'dark' : 'light';

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', isDark ? '#14130F' : '#14523A');
};
