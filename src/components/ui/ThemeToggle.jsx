import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@theme/ThemeProvider';

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
