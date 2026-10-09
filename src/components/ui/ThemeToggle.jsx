import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from '@theme/ThemeProvider';

const ICON = { light: Sun, dark: Moon, system: Monitor };
const LABEL = { light: 'Terang', dark: 'Malam', system: 'Sistem' };

/**
 * Tombol ikon untuk berganti tema dengan cepat.
 * `variant="onDark"` dipakai di dalam sidebar yang selalu gelap.
 */
export const ThemeToggle = ({ variant = 'default', className = '' }) => {
  const { isDark, toggleTheme } = useTheme();
  const Icon = isDark ? Sun : Moon;

  const tone = variant === 'onDark'
    ? 'text-cream-300 hover:text-cream-50 hover:bg-cream-50/10 focus-visible:ring-brand-500'
    : 'text-ink-500 hover:text-ink-800 hover:bg-cream-200 focus-visible:ring-brand-400';

  const label = isDark ? 'Aktifkan mode terang' : 'Aktifkan mode malam';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={label}
      aria-label={label}
      aria-pressed={isDark}
      className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 ${tone} ${className}`}
    >
      <Icon className="h-[17px] w-[17px]" strokeWidth={1.9} />
    </button>
  );
};

/** Pemilih tiga mode (Terang / Malam / Ikuti Sistem) untuk halaman pengaturan. */
export const ThemeModeSelector = ({ className = '' }) => {
  const { mode, setMode } = useTheme();

  return (
    <div
      role="radiogroup"
      aria-label="Pilih tema tampilan"
      className={`inline-flex items-center gap-1 rounded-2xl border border-cream-300 bg-cream-100 p-1 ${className}`}
    >
      {['light', 'dark', 'system'].map((option) => {
        const Icon = ICON[option];
        const isActive = mode === option;
        return (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => setMode(option)}
            title={`Tema ${LABEL[option]}`}
            className={`inline-flex min-h-9 items-center gap-1.5 rounded-xl px-3 text-caption font-bold transition-colors duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 ${
              isActive
                ? 'bg-cream-50 text-brand-800 shadow-sm ring-1 ring-cream-300'
                : 'text-ink-500 hover:text-ink-800'
            }`}
          >
            <Icon className="h-3.5 w-3.5" strokeWidth={2} />
            <span>{LABEL[option]}</span>
          </button>
        );
      })}
    </div>
  );
};
