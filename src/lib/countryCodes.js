/**
 * Daftar kode negara internasional seluruh dunia dengan dukungan SVG flag icon.
 * Kode dial, kode ISO 3166-1 alpha-2, dan format nomor lokal.
 */
export const COUNTRY_CODES = [
  // Populer / Prioritas Utama
  { code: 'ID', dial: '+62', dialNum: '62', name: 'Indonesia', placeholder: '812-3456-7890', priority: true },
  { code: 'MY', dial: '+60', dialNum: '60', name: 'Malaysia', placeholder: '12-345-6789', priority: true },
  { code: 'SG', dial: '+65', dialNum: '65', name: 'Singapura', placeholder: '8123-4567', priority: true },
  { code: 'BN', dial: '+673', dialNum: '673', name: 'Brunei Darussalam', placeholder: '812-3456', priority: true },
  { code: 'SA', dial: '+966', dialNum: '966', name: 'Arab Saudi', placeholder: '50-123-4567', priority: true },
  { code: 'AE', dial: '+971', dialNum: '971', name: 'Uni Emirat Arab', placeholder: '50-123-4567', priority: true },
  { code: 'EG', dial: '+20', dialNum: '20', name: 'Mesir', placeholder: '10-1234-5678', priority: true },
  { code: 'TR', dial: '+90', dialNum: '90', name: 'Turki', placeholder: '501-234-5678', priority: true },
  { code: 'PS', dial: '+970', dialNum: '970', name: 'Palestina', placeholder: '59-123-4567', priority: true },
  { code: 'JO', dial: '+962', dialNum: '962', name: 'Yordania', placeholder: '7-9012-3456', priority: true },
  { code: 'YE', dial: '+967', dialNum: '967', name: 'Yaman', placeholder: '71-234-5678', priority: true },
  { code: 'QA', dial: '+974', dialNum: '974', name: 'Qatar', placeholder: '3312-3456', priority: true },
  { code: 'KW', dial: '+965', dialNum: '965', name: 'Kuwait', placeholder: '5123-4567', priority: true },
  { code: 'OM', dial: '+968', dialNum: '968', name: 'Oman', placeholder: '9123-4567', priority: true },
  { code: 'BH', dial: '+973', dialNum: '973', name: 'Bahrain', placeholder: '3600-1234', priority: true },
  { code: 'US', dial: '+1', dialNum: '1', name: 'Amerika Serikat', placeholder: '202-555-0123', priority: true },
  { code: 'GB', dial: '+44', dialNum: '44', name: 'Inggris (UK)', placeholder: '7911-123456', priority: true },
  { code: 'AU', dial: '+61', dialNum: '61', name: 'Australia', placeholder: '412-345-678', priority: true },
  { code: 'JP', dial: '+81', dialNum: '81', name: 'Jepang', placeholder: '90-1234-5678', priority: true },
  { code: 'KR', dial: '+82', dialNum: '82', name: 'Korea Selatan', placeholder: '10-1234-5678', priority: true },

  // Asia Tenggara & Sekitarnya
  { code: 'TH', dial: '+66', dialNum: '66', name: 'Thailand', placeholder: '81-234-5678' },
  { code: 'PH', dial: '+63', dialNum: '63', name: 'Filipina', placeholder: '912-345-6789' },
  { code: 'VN', dial: '+84', dialNum: '84', name: 'Vietnam', placeholder: '91-234-5678' },
  { code: 'KH', dial: '+855', dialNum: '855', name: 'Kamboja', placeholder: '12-345-678' },
  { code: 'LA', dial: '+856', dialNum: '856', name: 'Laos', placeholder: '20-2345-6789' },
  { code: 'MM', dial: '+95', dialNum: '95', name: 'Myanmar', placeholder: '9-250-123-456' },
  { code: 'TL', dial: '+670', dialNum: '670', name: 'Timor Leste', placeholder: '7723-4567' },

  // Asia Selatan & Tengah & Timur
  { code: 'IN', dial: '+91', dialNum: '91', name: 'India', placeholder: '98123-45678' },
  { code: 'PK', dial: '+92', dialNum: '92', name: 'Pakistan', placeholder: '301-2345678' },
  { code: 'BD', dial: '+880', dialNum: '880', name: 'Bangladesh', placeholder: '1712-345678' },
  { code: 'LK', dial: '+94', dialNum: '94', name: 'Sri Lanka', placeholder: '71-234-5678' },
  { code: 'NP', dial: '+977', dialNum: '977', name: 'Nepal', placeholder: '984-1234567' },
  { code: 'BT', dial: '+975', dialNum: '975', name: 'Bhutan', placeholder: '17-123-456' },
  { code: 'MV', dial: '+960', dialNum: '960', name: 'Maladewa', placeholder: '791-2345' },
  { code: 'AF', dial: '+93', dialNum: '93', name: 'Afganistan', placeholder: '70-123-4567' },
  { code: 'CN', dial: '+86', dialNum: '86', name: 'Tiongkok', placeholder: '138-0013-8000' },
  { code: 'HK', dial: '+852', dialNum: '852', name: 'Hong Kong', placeholder: '5123-4567' },
  { code: 'MO', dial: '+853', dialNum: '853', name: 'Makau', placeholder: '6612-3456' },
  { code: 'TW', dial: '+886', dialNum: '886', name: 'Taiwan', placeholder: '912-345-678' },
  { code: 'MN', dial: '+976', dialNum: '976', name: 'Mongolia', placeholder: '8812-3456' },
  { code: 'KZ', dial: '+7', dialNum: '7', name: 'Kazakhstan', placeholder: '701-234-5678' },
  { code: 'UZ', dial: '+998', dialNum: '998', name: 'Uzbekistan', placeholder: '90-123-4567' },
  { code: 'TM', dial: '+993', dialNum: '993', name: 'Turkmenistan', placeholder: '65-123456' },
  { code: 'KG', dial: '+996', dialNum: '996', name: 'Kirgizstan', placeholder: '700-123-456' },
  { code: 'TJ', dial: '+992', dialNum: '992', name: 'Tajikistan', placeholder: '91-812-3456' },

  // Timur Tengah & Afrika Utara
  { code: 'IQ', dial: '+964', dialNum: '964', name: 'Irak', placeholder: '790-123-4567' },
  { code: 'IR', dial: '+98', dialNum: '98', name: 'Iran', placeholder: '912-345-6789' },
  { code: 'LB', dial: '+961', dialNum: '961', name: 'Lebanon', placeholder: '71-123-456' },
  { code: 'SY', dial: '+963', dialNum: '963', name: 'Suriah', placeholder: '944-123-456' },
  { code: 'MA', dial: '+212', dialNum: '212', name: 'Maroko', placeholder: '612-345678' },
  { code: 'DZ', dial: '+213', dialNum: '213', name: 'Aljazair', placeholder: '551-234567' },
  { code: 'TN', dial: '+216', dialNum: '216', name: 'Tunisia', placeholder: '20-123-456' },
  { code: 'LY', dial: '+218', dialNum: '218', name: 'Libya', placeholder: '91-234-5678' },
  { code: 'SD', dial: '+249', dialNum: '249', name: 'Sudan', placeholder: '91-234-5678' },

  // Eropa
  { code: 'DE', dial: '+49', dialNum: '49', name: 'Jerman', placeholder: '151-23456789' },
  { code: 'FR', dial: '+33', dialNum: '33', name: 'Prancis', placeholder: '6-12-34-56-78' },
  { code: 'NL', dial: '+31', dialNum: '31', name: 'Belanda', placeholder: '6-12345678' },
  { code: 'IT', dial: '+39', dialNum: '39', name: 'Italia', placeholder: '320-123-4567' },
  { code: 'ES', dial: '+34', dialNum: '34', name: 'Spanyol', placeholder: '612-345-678' },
  { code: 'PT', dial: '+351', dialNum: '351', name: 'Portugal', placeholder: '912-345-678' },
  { code: 'CH', dial: '+41', dialNum: '41', name: 'Swiss', placeholder: '78-123-4567' },
  { code: 'AT', dial: '+43', dialNum: '43', name: 'Austria', placeholder: '664-1234567' },
  { code: 'BE', dial: '+32', dialNum: '32', name: 'Belgia', placeholder: '470-12-34-56' },
  { code: 'SE', dial: '+46', dialNum: '46', name: 'Swedia', placeholder: '70-123-45-67' },
  { code: 'NO', dial: '+47', dialNum: '47', name: 'Norwegia', placeholder: '412-34-567' },
  { code: 'DK', dial: '+45', dialNum: '45', name: 'Denmark', placeholder: '20-12-34-56' },
  { code: 'FI', dial: '+358', dialNum: '358', name: 'Finlandia', placeholder: '40-1234567' },
  { code: 'PL', dial: '+48', dialNum: '48', name: 'Polandia', placeholder: '512-345-678' },
  { code: 'CZ', dial: '+420', dialNum: '420', name: 'Ceko', placeholder: '601-123-456' },
  { code: 'SK', dial: '+421', dialNum: '421', name: 'Slowakia', placeholder: '905-123-456' },
  { code: 'HU', dial: '+36', dialNum: '36', name: 'Hungaria', placeholder: '20-123-4567' },
  { code: 'RO', dial: '+40', dialNum: '40', name: 'Rumania', placeholder: '712-345-678' },
  { code: 'BG', dial: '+359', dialNum: '359', name: 'Bulgaria', placeholder: '87-123-4567' },
  { code: 'GR', dial: '+30', dialNum: '30', name: 'Yunani', placeholder: '691-234-5678' },
  { code: 'IE', dial: '+353', dialNum: '353', name: 'Irlandia', placeholder: '85-123-4567' },
  { code: 'RU', dial: '+7', dialNum: '7', name: 'Rusia', placeholder: '912-345-6789' },
  { code: 'UA', dial: '+380', dialNum: '380', name: 'Ukraina', placeholder: '50-123-4567' },
  { code: 'BY', dial: '+375', dialNum: '375', name: 'Belarus', placeholder: '29-123-45-67' },
  { code: 'RS', dial: '+381', dialNum: '381', name: 'Serbia', placeholder: '60-123-4567' },
  { code: 'HR', dial: '+385', dialNum: '385', name: 'Kroasia', placeholder: '91-123-4567' },
  { code: 'BA', dial: '+387', dialNum: '387', name: 'Bosnia dan Herzegovina', placeholder: '61-123-456' },
  { code: 'AL', dial: '+355', dialNum: '355', name: 'Albania', placeholder: '67-212-3456' },
  { code: 'MK', dial: '+389', dialNum: '389', name: 'Makedonia Utara', placeholder: '72-123-456' },
  { code: 'SI', dial: '+386', dialNum: '386', name: 'Slovenia', placeholder: '31-123-456' },
  { code: 'IS', dial: '+354', dialNum: '354', name: 'Islandia', placeholder: '612-3456' },
  { code: 'LU', dial: '+352', dialNum: '352', name: 'Luksemburg', placeholder: '621-123-456' },
  { code: 'CY', dial: '+357', dialNum: '357', name: 'Siprus', placeholder: '96-123456' },
  { code: 'MT', dial: '+356', dialNum: '356', name: 'Malta', placeholder: '9912-3456' },
  { code: 'MD', dial: '+373', dialNum: '373', name: 'Moldova', placeholder: '60-123-456' },
  { code: 'GE', dial: '+995', dialNum: '995', name: 'Georgia', placeholder: '595-12-34-56' },
  { code: 'AM', dial: '+374', dialNum: '374', name: 'Armenia', placeholder: '77-123456' },
  { code: 'AZ', dial: '+994', dialNum: '994', name: 'Azerbaijan', placeholder: '50-123-45-67' },

  // Amerika (Utara, Tengah, Selatan, Karibia)
  { code: 'CA', dial: '+1', dialNum: '1', name: 'Kanada', placeholder: '416-555-0123' },
  { code: 'MX', dial: '+52', dialNum: '52', name: 'Meksiko', placeholder: '55-1234-5678' },
  { code: 'BR', dial: '+55', dialNum: '55', name: 'Brasil', placeholder: '11-91234-5678' },
  { code: 'AR', dial: '+54', dialNum: '54', name: 'Argentina', placeholder: '9-11-1234-5678' },
  { code: 'CL', dial: '+56', dialNum: '56', name: 'Chili', placeholder: '9-1234-5678' },
  { code: 'CO', dial: '+57', dialNum: '57', name: 'Kolombia', placeholder: '300-123-4567' },
  { code: 'PE', dial: '+51', dialNum: '51', name: 'Peru', placeholder: '912-345-678' },
  { code: 'VE', dial: '+58', dialNum: '58', name: 'Venezuela', placeholder: '412-123-4567' },
  { code: 'EC', dial: '+593', dialNum: '593', name: 'Ekuador', placeholder: '99-123-4567' },
  { code: 'BO', dial: '+591', dialNum: '591', name: 'Bolivia', placeholder: '7123-4567' },
  { code: 'PY', dial: '+595', dialNum: '595', name: 'Paraguay', placeholder: '981-123456' },
  { code: 'UY', dial: '+598', dialNum: '598', name: 'Uruguay', placeholder: '94-123-456' },
  { code: 'CR', dial: '+506', dialNum: '506', name: 'Kosta Rika', placeholder: '8312-3456' },
  { code: 'PA', dial: '+507', dialNum: '507', name: 'Panama', placeholder: '6123-4567' },
  { code: 'GT', dial: '+502', dialNum: '502', name: 'Guatemala', placeholder: '5123-4567' },
  { code: 'HN', dial: '+504', dialNum: '504', name: 'Honduras', placeholder: '9123-4567' },
  { code: 'SV', dial: '+503', dialNum: '503', name: 'El Salvador', placeholder: '7012-3456' },
  { code: 'NI', dial: '+505', dialNum: '505', name: 'Nikaragua', placeholder: '8123-4567' },
  { code: 'CU', dial: '+53', dialNum: '53', name: 'Kuba', placeholder: '5-123-4567' },
  { code: 'DO', dial: '+1', dialNum: '1', name: 'Republik Dominika', placeholder: '809-234-5678' },
  { code: 'JM', dial: '+1', dialNum: '1', name: 'Jamaika', placeholder: '876-123-4567' },
  { code: 'PR', dial: '+1', dialNum: '1', name: 'Puerto Riko', placeholder: '787-123-4567' },
  { code: 'TT', dial: '+1', dialNum: '1', name: 'Trinidad dan Tobago', placeholder: '868-123-4567' },

  // Oseania
  { code: 'NZ', dial: '+64', dialNum: '64', name: 'Selandia Baru', placeholder: '21-123-4567' },
  { code: 'PG', dial: '+675', dialNum: '675', name: 'Papua Nugini', placeholder: '7012-3456' },
  { code: 'FJ', dial: '+679', dialNum: '679', name: 'Fiji', placeholder: '701-2345' },

  // Afrika
  { code: 'ZA', dial: '+27', dialNum: '27', name: 'Afrika Selatan', placeholder: '71-123-4567' },
  { code: 'NG', dial: '+234', dialNum: '234', name: 'Nigeria', placeholder: '802-123-4567' },
  { code: 'KE', dial: '+254', dialNum: '254', name: 'Kenya', placeholder: '712-345678' },
  { code: 'ET', dial: '+251', dialNum: '251', name: 'Etiopia', placeholder: '91-123-4567' },
  { code: 'GH', dial: '+233', dialNum: '233', name: 'Ghana', placeholder: '24-123-4567' },
  { code: 'TZ', dial: '+255', dialNum: '255', name: 'Tanzania', placeholder: '652-123-456' },
  { code: 'UG', dial: '+256', dialNum: '256', name: 'Uganda', placeholder: '772-123456' },
  { code: 'SN', dial: '+221', dialNum: '221', name: 'Senegal', placeholder: '77-123-4567' },
  { code: 'CI', dial: '+225', dialNum: '225', name: 'Pantai Gading', placeholder: '01-23-45-67-89' },
  { code: 'CM', dial: '+237', dialNum: '237', name: 'Kamerun', placeholder: '6-7123-4567' },
  { code: 'SO', dial: '+252', dialNum: '252', name: 'Somalia', placeholder: '61-234567' },
  { code: 'RW', dial: '+250', dialNum: '250', name: 'Rwanda', placeholder: '788-123-456' },
  { code: 'ZW', dial: '+263', dialNum: '263', name: 'Zimbabwe', placeholder: '71-234-5678' },
  { code: 'ZM', dial: '+260', dialNum: '260', name: 'Zambia', placeholder: '95-5123456' },
  { code: 'AO', dial: '+244', dialNum: '244', name: 'Angola', placeholder: '912-345-678' },
  { code: 'MZ', dial: '+258', dialNum: '258', name: 'Mozambik', placeholder: '82-123-4567' },
  { code: 'MG', dial: '+261', dialNum: '261', name: 'Madagaskar', placeholder: '32-12-345-67' },
  { code: 'MU', dial: '+230', dialNum: '230', name: 'Mauritius', placeholder: '5251-2345' }
];

export const DEFAULT_COUNTRY = COUNTRY_CODES[0]; // Indonesia +62

/**
 * Mencari negara berdasarkan kode negara (ID, MY, dll) atau dial code (+62, 62, dll).
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
      nationalNumber: cleaned.slice(1),
      fullPhone: '62' + cleaned.slice(1)
    };
  }

  // Cek apakah cocok dengan dialNum salah satu negara (prioritaskan dialNum terpanjang)
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

  // Fallback: nomor lokal negara fallback
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
