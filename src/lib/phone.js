/**
 * Nomor telepon Indonesia saja.
 *
 * Nilai yang disimpan dan dikirim ke server selalu berawalan 62 (format yang dipakai
 * Fonnte), sedangkan yang dilihat manusia selalu berawalan 0 tanpa spasi.
 */

const ID_PREFIX = '62';

const digitsOnly = (raw) => String(raw ?? '').replace(/[^0-9]/g, '');

/** Ubah 08xx, +62xx, atau 62xx menjadi 62xx. */
export const normalizePhone = (raw) => {
  const digits = digitsOnly(raw);
  if (!digits) return '';
  if (digits.startsWith('0')) return ID_PREFIX + digits.slice(1);
  if (digits.startsWith(ID_PREFIX)) return digits;
  if (digits.startsWith('8')) return ID_PREFIX + digits;
  return digits;
};

/** Ubah 62xx menjadi 08xx untuk ditampilkan. */
export const displayPhone = (raw) => {
  const normalized = normalizePhone(raw);
  if (normalized.length > ID_PREFIX.length && normalized.startsWith(ID_PREFIX)) {
    return '0' + normalized.slice(ID_PREFIX.length);
  }
  return normalized;
};

/** Nomor seluler Indonesia yang wajar: 628 diikuti 7–12 digit. */
export const isValidPhone = (raw) => /^628\d{7,12}$/.test(normalizePhone(raw));
