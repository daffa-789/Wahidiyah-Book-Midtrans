/* Deteksi jenis berkas dari isinya, bukan dari yang diklaim klien (VULN-11).
 *
 * `mimetype` dan ekstensi berasal dari peramban dan mudah dipalsukan: berkas
 * HTML bisa dikirim sebagai "foto.png" atau ".pdf". Semua pemeriksaan di sini
 * hanya membaca beberapa byte pertama, jadi murah dan tidak perlu pustaka.
 */

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const JPEG = Buffer.from([0xff, 0xd8, 0xff]);
const OLE = Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
const ZIP = Buffer.from([0x50, 0x4b, 0x03, 0x04]);
const PDF = Buffer.from('%PDF-');

const startsWith = (buffer, bytes) =>
  buffer.length >= bytes.length && buffer.subarray(0, bytes.length).equals(bytes);

const ascii = (buffer, start, end) => buffer.toString('latin1', start, end);

/** MIME gambar yang dikenali dari magic byte, atau null bila bukan gambar. */
export const sniffImageMime = (buffer) => {
  if (!buffer?.length) return null;
  if (startsWith(buffer, PNG)) return 'image/png';
  if (startsWith(buffer, JPEG)) return 'image/jpeg';
  if (buffer.length >= 12 && ascii(buffer, 0, 4) === 'RIFF' && ascii(buffer, 8, 12) === 'WEBP') {
    return 'image/webp';
  }
  if (buffer.length >= 6 && /^GIF8[79]a$/.test(ascii(buffer, 0, 6))) return 'image/gif';
  return null;
};

/* Teks sah: UTF-8 valid, atau berkode lama (CSV dari Excel Windows-1252)
 * asalkan tidak memuat byte kendali biner. NUL byte selalu menandakan biner.
 */
const looksLikeText = (buffer) => {
  const sample = buffer.subarray(0, 8192);
  if (sample.includes(0)) return false;
  try {
    new TextDecoder('utf-8', { fatal: true }).decode(sample);
    return true;
  } catch {
    for (const byte of sample) {
      if (byte < 0x09 || (byte > 0x0d && byte < 0x20)) return false;
    }
    return true;
  }
};

/** Apakah isi berkas benar-benar cocok dengan ekstensi konten yang diizinkan. */
export const matchesContentExtension = (buffer, extension) => {
  if (!buffer?.length) return false;
  const ext = String(extension || '')
    .replace(/^\./, '')
    .toLowerCase();

  switch (ext) {
    case 'pdf':
      return startsWith(buffer, PDF);
    case 'docx':
    case 'odt':
    case 'epub':
      return startsWith(buffer, ZIP);
    case 'doc':
      return startsWith(buffer, OLE);
    case 'rtf':
      return ascii(buffer, 0, 5) === '{\\rtf';
    case 'txt':
    case 'md':
    case 'csv':
      return looksLikeText(buffer);
    default:
      return false;
  }
};

/** MIME gambar dari data URL, tanpa mempercayai label di dalam URL-nya. */
export const sniffDataUrlImage = (dataUrl) => {
  const match = /^data:[^;]+;base64,(.+)$/.exec(String(dataUrl || ''));
  if (!match) return null;
  try {
    return sniffImageMime(Buffer.from(match[1], 'base64'));
  } catch {
    return null;
  }
};
