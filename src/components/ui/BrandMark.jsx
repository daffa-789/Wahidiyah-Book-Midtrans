/**
 * BrandMark — lambang resmi Wahidiyah Book sebagai SVG inline.
 *
 * Kenapa SVG inline, bukan `<img src="/logo-wahidiyah.webp">`:
 *  1. Tidak ada permintaan jaringan tambahan sama sekali (0 byte unduhan
 *     untuk lambang) — SVG-nya menumpang di bundle yang sudah diunduh.
 *  2. Tajam di semua kerapatan piksel (Retina/AMOLED) tanpa perlu varian @2x.
 *  3. Warnanya bisa disetel lewat `tone`, sehingga di tema malam lambang tetap
 *     kontras tanpa perlu berkas terpisah.
 *
 * Geometri SVG sengaja identik dengan `public/icon.svg` (favicon + ikon PWA)
 * supaya lambang di dalam aplikasi dan ikon di layar utama pengguna tidak
 * pernah berbeda — satu sumber kebenaran visual.
 */
export const BrandMark = ({ className = 'h-6 w-6', tone = 'brand', title = 'Wahidiyah Book' }) => {
  // Dua palet: `brand` untuk latar terang (hijau tua + emas), `light` untuk
  // ditempel di atas permukaan gelap (mis. kartu emerald di halaman Pro).
  const palettes = {
    brand: { bg: ['#0E3D2C', '#14523A', '#216B4C'], page: '#FFFFFF', gold: ['#D4AF4F', '#B8860B'] },
    light: { bg: ['#FFFFFF', '#F1F5F2', '#DCE7E0'], page: '#14523A', gold: ['#D4AF4F', '#B8860B'] }
  };
  const p = palettes[tone] || palettes.brand;
  // id unik per instance supaya gradien beberapa lambang di satu halaman
  // tidak saling menimpa (SVG memakai namespace id global di DOM).
  const uid = `bm-${tone}`;

  return (
    <svg
      className={className}
      viewBox="0 0 512 512"
      role="img"
      aria-label={title}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={`${uid}-bg`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={p.bg[0]} />
          <stop offset="50%" stopColor={p.bg[1]} />
          <stop offset="100%" stopColor={p.bg[2]} />
        </linearGradient>
        <linearGradient id={`${uid}-gold`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={p.gold[0]} />
          <stop offset="100%" stopColor={p.gold[1]} />
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="112" fill={`url(#${uid}-bg)`} />
      <path
        d="M120 160c0-17.7 14.3-32 32-32h80c35.3 0 64 28.7 64 64v192c-17-10-37.5-16-64-16h-80c-17.7 0-32-14.3-32-32V160z"
        fill={p.page}
        opacity="0.95"
      />
      <path
        d="M392 160c0-17.7-14.3-32-32-32h-80c-35.3 0-64 28.7-64 64v192c17-10 37.5-16 64-16h80c17.7 0 32-14.3 32-32V160z"
        fill={p.page}
        opacity="0.9"
      />
      <path d="M256 192v192" stroke={`url(#${uid}-gold)`} strokeWidth="12" strokeLinecap="round" />
      <circle cx="256" cy="150" r="16" fill={`url(#${uid}-gold)`} />
    </svg>
  );
};
