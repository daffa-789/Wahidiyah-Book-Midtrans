import { BrandMark } from '@ui/BrandMark';

/**
 * Header merek bersama untuk layar autentikasi (masuk / daftar).
 *
 * Sebelumnya blok BrandMark + "Wahidiyah Book / Perpustakaan Digital" disalin
 * identik di `LoginScreen` dan `RegisterScreen`.
 */
export const AuthBrandHeader = ({ title }) => (
  <div className="mb-7">
    <div className="mb-4 flex items-center gap-2.5">
      <BrandMark className="h-11 w-11 rounded-2xl shadow-sm" />
      <div className="leading-tight">
        <p className="font-display text-lead font-bold tracking-tight text-ink-900">Wahidiyah Book</p>
        <p className="text-micro font-semibold uppercase tracking-wider text-ink-400">Perpustakaan Digital</p>
      </div>
    </div>
    <h1 className="font-display text-displaySm font-bold tracking-tight text-ink-900">{title}</h1>
  </div>
);
