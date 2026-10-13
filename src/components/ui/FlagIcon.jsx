import { useState } from 'react';
import { cn } from '@lib/utils';

/**
 * Komponen ikon bendera negara berbasis vektor SVG.
 * Menggunakan file SVG resmi seluruh dunia dari folder public/flags/[iso].svg.
 *
 * @param {Object} props
 * @param {string} [props.code] - ISO 3166-1 alpha-2 kode negara (contoh: 'ID', 'MY', 'SA', 'US')
 * @param {string} [props.flag] - Nama berkas flag SVG jika berbeda dari ISO code (contoh: 'sh-ac')
 * @param {string} [props.name] - Nama negara untuk atribut alt & title
 * @param {string} [props.className] - Kelas CSS tambahan
 */
export const FlagIcon = ({
  code = '',
  flag = '',
  name = '',
  className = 'h-3.5 w-5 rounded-[2px] object-cover shadow-[0_0_0_1px_rgba(0,0,0,0.1)]'
}) => {
  const [hasError, setHasError] = useState(false);
  const flagKey = String(flag || code || '').trim().toLowerCase();

  if (!flagKey || hasError) {
    return (
      <span
        title={name || code}
        className={cn(
          'inline-flex h-3.5 w-5 items-center justify-center rounded-[2px] bg-cream-200 text-[9px] font-bold text-ink-600 shadow-[0_0_0_1px_rgba(0,0,0,0.1)] select-none',
          className
        )}
      >
        {String(code || flagKey || '').toUpperCase().slice(0, 2)}
      </span>
    );
  }

  return (
    <img
      src={`/flags/${flagKey}.svg`}
      alt={name ? `Bendera ${name}` : `Bendera ${code}`}
      title={name || code}
      loading="lazy"
      onError={() => setHasError(true)}
      className={cn('inline-block shrink-0 align-middle select-none', className)}
    />
  );
};
