/**
 * Daftar kode negara dan region untuk input nomor telepon/WhatsApp internasional.
 * Format dialCode menyertakan '+' untuk UI, dan dialCodeNumber berupa angka saja.
 */
export const COUNTRY_CODES = [
  { code: 'ID', dial: '+62', dialNum: '62', flag: '🇮🇩', name: 'Indonesia', placeholder: '812-3456-7890' },
  { code: 'MY', dial: '+60', dialNum: '60', flag: '🇲🇾', name: 'Malaysia', placeholder: '12-345-6789' },
  { code: 'SG', dial: '+65', dialNum: '65', flag: '🇸🇬', name: 'Singapura', placeholder: '8123-4567' },
  { code: 'BN', dial: '+673', dialNum: '673', flag: '🇧🇳', name: 'Brunei Darussalam', placeholder: '812-3456' },
  { code: 'SA', dial: '+966', dialNum: '966', flag: '🇸🇦', name: 'Arab Saudi', placeholder: '50-123-4567' },
  { code: 'AE', dial: '+971', dialNum: '971', flag: '🇦🇪', name: 'Uni Emirat Arab', placeholder: '50-123-4567' },
  { code: 'EG', dial: '+20', dialNum: '20', flag: '🇪🇬', name: 'Mesir', placeholder: '10-1234-5678' },
  { code: 'TR', dial: '+90', dialNum: '90', flag: '🇹🇷', name: 'Turki', placeholder: '501-234-5678' },
  { code: 'JO', dial: '+962', dialNum: '962', flag: '🇯🇴', name: 'Yordania', placeholder: '7-9012-3456' },
  { code: 'YE', dial: '+967', dialNum: '967', flag: '🇾🇪', name: 'Yaman', placeholder: '71-234-5678' },
  { code: 'QA', dial: '+974', dialNum: '974', flag: '🇶🇦', name: 'Qatar', placeholder: '3312-3456' },
  { code: 'KW', dial: '+965', dialNum: '965', flag: '🇰🇼', name: 'Kuwait', placeholder: '5123-4567' },
  { code: 'OM', dial: '+968', dialNum: '968', flag: '🇴🇲', name: 'Oman', placeholder: '9123-4567' },
  { code: 'PS', dial: '+970', dialNum: '970', flag: '🇵🇸', name: 'Palestina', placeholder: '59-123-4567' },
  { code: 'US', dial: '+1', dialNum: '1', flag: '🇺🇸', name: 'Amerika Serikat', placeholder: '202-555-0123' },
  { code: 'GB', dial: '+44', dialNum: '44', flag: '🇬🇧', name: 'Inggris (UK)', placeholder: '7911-123456' },
  { code: 'AU', dial: '+61', dialNum: '61', flag: '🇦🇺', name: 'Australia', placeholder: '412-345-678' },
  { code: 'JP', dial: '+81', dialNum: '81', flag: '🇯🇵', name: 'Jepang', placeholder: '90-1234-5678' },
  { code: 'KR', dial: '+82', dialNum: '82', flag: '🇰🇷', name: 'Korea Selatan', placeholder: '10-1234-5678' },
  { code: 'DE', dial: '+49', dialNum: '49', flag: '🇩🇪', name: 'Jerman', placeholder: '151-23456789' },
  { code: 'FR', dial: '+33', dialNum: '33', flag: '🇫🇷', name: 'Prancis', placeholder: '6-12-34-56-78' },
  { code: 'NL', dial: '+31', dialNum: '31', flag: '🇳🇱', name: 'Belanda', placeholder: '6-12345678' },
  { code: 'TH', dial: '+66', dialNum: '66', flag: '🇹🇭', name: 'Thailand', placeholder: '81-234-5678' },
  { code: 'PH', dial: '+63', dialNum: '63', flag: '🇵🇭', name: 'Filipina', placeholder: '912-345-6789' },
  { code: 'VN', dial: '+84', dialNum: '84', flag: '🇻🇳', name: 'Vietnam', placeholder: '91-234-5678' },
  { code: 'KH', dial: '+855', dialNum: '855', flag: '🇰🇭', name: 'Kamboja', placeholder: '12-345-678' },
  { code: 'IN', dial: '+91', dialNum: '91', flag: '🇮🇳', name: 'India', placeholder: '98123-45678' },
  { code: 'PK', dial: '+92', dialNum: '92', flag: '🇵🇰', name: 'Pakistan', placeholder: '301-2345678' },
  { code: 'BD', dial: '+880', dialNum: '880', flag: '🇧🇩', name: 'Bangladesh', placeholder: '1712-345678' },
  { code: 'CN', dial: '+86', dialNum: '86', flag: '🇨🇳', name: 'Tiongkok', placeholder: '138-0013-8000' },
  { code: 'TW', dial: '+886', dialNum: '886', flag: '🇹🇼', name: 'Taiwan', placeholder: '912-345-678' },
  { code: 'HK', dial: '+852', dialNum: '852', flag: '🇭🇰', name: 'Hong Kong', placeholder: '5123-4567' },
  { code: 'NZ', dial: '+64', dialNum: '64', flag: '🇳🇿', name: 'Selandia Baru', placeholder: '21-123-4567' },
  { code: 'CA', dial: '+1', dialNum: '1', flag: '🇨🇦', name: 'Kanada', placeholder: '416-555-0123' },
  { code: 'RU', dial: '+7', dialNum: '7', flag: '🇷🇺', name: 'Rusia', placeholder: '912-345-6789' },
  { code: 'BR', dial: '+55', dialNum: '55', flag: '🇧🇷', name: 'Brasil', placeholder: '11-91234-5678' },
  { code: 'ZA', dial: '+27', dialNum: '27', flag: '🇿🇦', name: 'Afrika Selatan', placeholder: '71-123-4567' },
  { code: 'MA', dial: '+212', dialNum: '212', flag: '🇲🇦', name: 'Maroko', placeholder: '612-345678' }
];

export const DEFAULT_COUNTRY = COUNTRY_CODES[0]; // Indonesia +62

/**
 * Mencari negara berdasarkan kode negara atau dial code.
 */
export function findCountry(codeOrDial) {
  if (!codeOrDial) return DEFAULT_COUNTRY;
  const cleaned = String(codeOrDial).trim().toUpperCase();
  return (
    COUNTRY_CODES.find(
      (c) =>
        c.code === cleaned ||
        c.dial === cleaned ||
        c.dialNum === cleaned ||
        c.dial === `+${cleaned}`
    ) || DEFAULT_COUNTRY
  );
}

/**
 * Mengurai string nomor HP menjadi { country, nationalNumber, fullPhone }
 */
export function parsePhoneNumber(rawPhone, fallbackCountry = DEFAULT_COUNTRY) {
  if (!rawPhone) {
    return { country: fallbackCountry, nationalNumber: '', fullPhone: '' };
  }

  let cleaned = String(rawPhone).trim().replace(/[^0-9+]/g, '');
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.slice(1);
  }

  // Jika diawali 08 (format lokal Indonesia)
  if (cleaned.startsWith('08')) {
    return {
      country: DEFAULT_COUNTRY,
      nationalNumber: cleaned.slice(1), // buang '0', jadi 8xxx
      fullPhone: '62' + cleaned.slice(1)
    };
  }

  // Cek apakah cocok dengan dialNum salah satu negara
  // Urutkan dari dialNum terpanjang agar +966 cocok sebelum +9 dll
  const sorted = [...COUNTRY_CODES].sort((a, b) => b.dialNum.length - a.dialNum.length);
  for (const c of sorted) {
    if (cleaned.startsWith(c.dialNum) && cleaned.length > c.dialNum.length) {
      const national = cleaned.slice(c.dialNum.length);
      return {
        country: c,
        nationalNumber: national,
        fullPhone: c.dialNum + national
      };
    }
  }

  // Fallback: anggap nomor lokal negara fallback
  let national = cleaned;
  if (national.startsWith('0')) {
    national = national.slice(1);
  }
  return {
    country: fallbackCountry,
    nationalNumber: national,
    fullPhone: fallbackCountry.dialNum + national
  };
}
