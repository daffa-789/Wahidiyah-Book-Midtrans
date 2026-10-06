

import sharp from 'sharp';
import { isSafeRawImageFallback } from './http.js';


export async function toWebp(buffer, { width, quality, fallbackMime = 'application/octet-stream' }) {
  try {
    const converted = await sharp(buffer)
      .resize({ width, withoutEnlargement: true })
      .webp({ quality })
      .toBuffer();
    return { buffer: converted, mime: 'image/webp', converted: true };
  } catch (error) {
    console.warn(`Konversi WebP gagal (lebar ${width}):`, error.message);
    return { buffer, mime: fallbackMime, converted: false };
  }
}


export const toDataUrl = (buffer, mime) =>
  buffer ? `data:${mime};base64,${buffer.toString('base64')}` : null;


export async function compressAvatarDataUrl(dataUrl) {
  const parsed = /^data:([^;,]+)?(;base64)?,([\s\S]*)$/.exec(String(dataUrl || ''));
  if (!parsed) return null;
  if (!parsed[2] || !parsed[3]) return null;

  let buffer;
  try {
    buffer = Buffer.from(parsed[3], 'base64');
  } catch {
    return null;
  }
  if (buffer.length === 0) return null;

  const originalMime = parsed[1] || 'application/octet-stream';
  const result = await toWebp(buffer, {
    width: 256,
    quality: 80,
    fallbackMime: originalMime
  });

  if (!result.converted && !isSafeRawImageFallback(originalMime)) return { rejected: true };
  return { dataUrl: toDataUrl(result.buffer, result.mime) };
}

export { isSafeRawImageFallback };
