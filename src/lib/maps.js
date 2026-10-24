/**
 * Helper utilitas untuk tautan Google Maps universal
 * Mendukung URL langsung (maps.app.goo.gl), format pipa "Nama Tempat | URL",
 * titik koordinat lat,lng, atau nama tempat biasa.
 * Tidak membutuhkan Google Maps API / kartu kredit (100% Gratis & Native).
 */

export function getMapUrl(location) {
  if (!location) return null;
  const trimmed = String(location).trim();

  // 1. Format gabungan: "Nama Tempat | https://maps.app.goo.gl/..."
  if (trimmed.includes('|')) {
    const parts = trimmed.split('|');
    const urlPart = parts.find((p) => /^https?:\/\//i.test(p.trim()));
    if (urlPart) return urlPart.trim();
  }

  // 2. URL langsung Google Maps
  if (/^https?:\/\/(maps\.app\.goo\.gl|goo\.gl\/maps|www\.google\.[a-z.]+\/maps|maps\.google\.[a-z.]+)/i.test(trimmed)) {
    return trimmed;
  }

  // 3. Titik Koordinat Latitude, Longitude (contoh: -7.8279855, 112.0081854)
  const coordMatch = trimmed.match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/);
  if (coordMatch) {
    return `https://www.google.com/maps?q=${coordMatch[1]},${coordMatch[2]}`;
  }

  // 4. Fallback: pencarian nama tempat
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(trimmed)}`;
}

export function getDisplayLocation(location) {
  if (!location) return '';
  const trimmed = String(location).trim();
  if (trimmed.includes('|')) {
    return trimmed.split('|')[0].trim();
  }
  if (/^https?:\/\//i.test(trimmed)) {
    return 'Buka Titik Lokasi Google Maps';
  }
  return trimmed;
}
