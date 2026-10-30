import sharp from 'sharp';


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
