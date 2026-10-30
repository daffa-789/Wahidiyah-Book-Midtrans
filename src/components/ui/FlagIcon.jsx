import { cn } from '@lib/utils';

/**
 * Lencana kode negara dua huruf (ISO 3166-1 alpha-2).
 *
 * Komponen ini dulu memuat /flags/[iso].svg dari 271 berkas vektor. Asetnya dibuang
 * pada R71 karena aplikasi hanya melayani nomor Indonesia: Fonnte selalu mengirim
 * `countryCode: '62'` (server/providers/fonnte.js) apa pun negara yang dipilih,
 * jadi nomor non-62 tetap tidak terkirim walau benderanya ada.
 *
 * @param {Object} props
 * @param {string} [props.code] - Kode ISO dua huruf, contoh 'ID'
 * @param {string} [props.flag] - Nama berkas flag lama; hanya dipakai bila `code` kosong
 * @param {string} [props.name] - Nama negara untuk atribut title
 * @param {string} [props.className] - Kelas CSS tambahan
 */
export const FlagIcon = ({
  code = '',
  flag = '',
  name = '',
  className = 'h-3.5 w-5 rounded-[2px] object-cover shadow-[0_0_0_1px_rgba(0,0,0,0.1)]'
}) => {
  const label = String(code || flag || '').trim().toUpperCase().slice(0, 2);

  if (!label) return null;

  return (
    <span
      title={name || label}
      className={cn(
        'inline-flex h-3.5 w-5 items-center justify-center rounded-[2px] bg-cream-200 text-[9px] font-bold text-ink-600 shadow-[0_0_0_1px_rgba(0,0,0,0.1)] select-none',
        className
      )}
    >
      {label}
    </span>
  );
};
