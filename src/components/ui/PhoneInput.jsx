import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';
import { COUNTRY_CODES, DEFAULT_COUNTRY, findCountry, parsePhoneNumber } from '@lib/countryCodes';
import { FlagIcon } from './FlagIcon';
import { cn } from '@lib/utils';

/**
 * Komponen input nomor telepon internasional dengan pemilih kode negara / region & bendera SVG.
 * Mendukung pencarian bilingual (Indonesia & Inggris), format kode negara internasional,
 * dan normalisasi otomatis.
 * 
 * @param {Object} props
 * @param {string} [props.value] - String nomor HP (contoh: '0812...', '62812...', '+62812...')
 * @param {function} [props.onChange] - Callback (fullPhone: string) => void (contoh output: '6281234567890')
 * @param {string} [props.placeholder] - Custom placeholder
 * @param {boolean} [props.disabled] - Status nonaktif
 * @param {boolean} [props.required] - Status wajib diisi
 * @param {string} [props.id] - ID elemen input
 * @param {string} [props.name] - Nama field formulir
 * @param {string} [props.className] - Kelas CSS wrapper
 */
export const PhoneInput = ({
  value = '',
  onChange,
  placeholder,
  disabled = false,
  required = false,
  id = 'phone',
  name = 'phone',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);
  const numberInputRef = useRef(null);

  // Parsing nomor saat ini menjadi { country, nationalNumber }
  const parsed = useMemo(() => {
    return parsePhoneNumber(value, DEFAULT_COUNTRY);
  }, [value]);

  const [selectedCountry, setSelectedCountry] = useState(parsed.country);
  const [nationalNumber, setNationalNumber] = useState(parsed.nationalNumber);

  // Sinkronisasi jika value dari parent berubah
  useEffect(() => {
    const next = parsePhoneNumber(value, selectedCountry);
    setSelectedCountry(next.country);
    setNationalNumber(next.nationalNumber);
  }, [value]);

  // Tutup dropdown saat klik di luar atau tombol Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Auto focus input pencarian saat dropdown dibuka
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Filter negara berdasarkan pencarian (nama Indonesia, Inggris, dial code, atau kode ISO)
  const filteredCountries = useMemo(() => {
    if (!search.trim()) {
      return [...COUNTRY_CODES].sort((a, b) => {
        if (a.priority && !b.priority) return -1;
        if (!a.priority && b.priority) return 1;
        return a.name.localeCompare(b.name, 'id');
      });
    }
    const q = search.trim().toLowerCase();
    return COUNTRY_CODES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.enName && c.enName.toLowerCase().includes(q)) ||
        c.dial.includes(q) ||
        c.dialNum.includes(q) ||
        c.code.toLowerCase().includes(q)
    ).sort((a, b) => {
      const aStarts =
        c.name.toLowerCase().startsWith(q) || (c.enName && c.enName.toLowerCase().startsWith(q));
      const bStarts =
        b.name.toLowerCase().startsWith(q) || (b.enName && b.enName.toLowerCase().startsWith(q));
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      return a.name.localeCompare(b.name, 'id');
    });
  }, [search]);

  // Handler saat negara dipilih
  const handleSelectCountry = (country) => {
    setSelectedCountry(country);
    setIsOpen(false);
    setSearch('');

    // Update full phone ke parent
    const fullPhone = nationalNumber ? `${country.dialNum}${nationalNumber}` : '';
    onChange?.(fullPhone);

    // Fokus kembali ke input nomor
    setTimeout(() => {
      numberInputRef.current?.focus();
    }, 50);
  };

  // Handler saat nomor diubah
  const handleNumberChange = (event) => {
    let raw = event.target.value.replace(/[^0-9]/g, '');

    // Jika pengguna mengetik '0' di awal (misal 0812...), buang '0'-nya karena sudah ada kode negara
    if (raw.startsWith('0')) {
      raw = raw.replace(/^0+/, '');
    }

    setNationalNumber(raw);
    const fullPhone = raw ? `${selectedCountry.dialNum}${raw}` : '';
    onChange?.(fullPhone);
  };

  return (
    <div className={cn('relative', className)} ref={dropdownRef}>
      {/* Container Input Utama */}
      <div className="auth-input-wrap flex items-center transition focus-within:ring-2 focus-within:ring-brand-500/20">
        {/* Tombol Pemilih Region & Kode Negara */}
        <button
          type="button"
          onClick={() => !disabled && setIsOpen((prev) => !prev)}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-label={`Pilih negara (saat ini ${selectedCountry.name} ${selectedCountry.dial})`}
          className="flex shrink-0 items-center gap-2 rounded-l-lg py-2.5 pl-3 pr-2 text-sm font-semibold text-ink-800 transition hover:bg-cream-200/60 focus:outline-none disabled:opacity-50"
        >
          <FlagIcon
            code={selectedCountry.code}
            flag={selectedCountry.flag}
            name={selectedCountry.name}
            className="h-3.5 w-5 rounded-[2px] object-cover shadow-[0_0_0_1px_rgba(0,0,0,0.12)] shrink-0"
          />
          <span className="text-xs font-bold tracking-tight text-ink-700">
            {selectedCountry.dial}
          </span>
          <ChevronDown
            className={cn(
              'h-3.5 w-3.5 text-ink-400 transition-transform duration-200',
              isOpen && 'rotate-180 text-brand-700'
            )}
          />
        </button>

        {/* Garis Pemisah Vertikal */}
        <div className="h-5 w-px bg-cream-300 mx-1 shrink-0" aria-hidden="true" />

        {/* Input Nomor Telepon */}
        <input
          ref={numberInputRef}
          id={id}
          name={name}
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          value={nationalNumber}
          onChange={handleNumberChange}
          disabled={disabled}
          required={required}
          placeholder={placeholder || (selectedCountry.code === 'ID' ? '812-3456-7890' : '812-3456-789')}
          className="w-full min-w-0 border-0 bg-transparent px-2.5 py-2.5 text-sm font-medium text-ink-900 placeholder:text-ink-400 focus:outline-none disabled:opacity-60"
        />
      </div>

      {/* Dropdown Popover Daftar Negara */}
      {isOpen && (
        <div
          role="listbox"
          className="absolute left-0 top-full z-50 mt-1.5 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-cream-200 bg-cream-50 p-2 shadow-xl ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Kolom Pencarian */}
          <div className="relative mb-2">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari negara (Indonesia, Malaysia, dll)..."
              className="w-full rounded-xl border border-cream-200 bg-white py-1.5 pl-8 pr-3 text-xs font-medium text-ink-800 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          {/* Daftar Scrollable Negara (240+ Negara Dunia) */}
          <div className="max-h-60 overflow-y-auto space-y-0.5 pr-1 text-xs custom-scrollbar">
            {filteredCountries.length === 0 ? (
              <div className="p-3 text-center text-xs text-ink-400">
                Negara tidak ditemukan
              </div>
            ) : (
              filteredCountries.map((country) => {
                const isSelected = country.code === selectedCountry.code;
                return (
                  <button
                    key={country.code}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelectCountry(country)}
                    className={cn(
                      'flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-left transition',
                      isSelected
                        ? 'bg-brand-50 text-brand-900 font-bold'
                        : 'text-ink-700 hover:bg-cream-150'
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FlagIcon
                        code={country.code}
                        flag={country.flag}
                        name={country.name}
                        className="h-3.5 w-5 rounded-[2px] object-cover shadow-[0_0_0_1px_rgba(0,0,0,0.12)] shrink-0"
                      />
                      <span className="truncate">{country.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      <span className="font-mono text-[11px] font-semibold text-ink-500">
                        {country.dial}
                      </span>
                      {isSelected && <Check className="h-3.5 w-3.5 text-brand-700" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
