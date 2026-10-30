import { FonnteProvider } from './fonnte.js';
import { DemoProvider } from './demo.js';
import { logger } from '../logger.js';

// Instansiasi singleton untuk setiap provider
const providers = {
  fonnte: new FonnteProvider(),
  demo: new DemoProvider()
};

/**
 * Mendapatkan provider WhatsApp yang aktif berdasarkan pengaturan di .env.
 *
 * Prioritas pemilihan:
 * 1. Env WHATSAPP_PROVIDER diisi 'fonnte' atau 'demo'.
 * 2. Auto-detect jika FONNTE_TOKEN terdeteksi di .env.
 * 3. Fallback ke DemoProvider jika kredensial gateway kosong.
 *
 * @returns {import('./base.js').BaseWhatsAppProvider}
 */
export function getActiveWhatsAppProvider() {
  const chosenName = (process.env.WHATSAPP_PROVIDER || '').trim().toLowerCase();

  if (chosenName && providers[chosenName]) {
    const provider = providers[chosenName];
    if (provider.isConfigured()) {
      return provider;
    }
    logger.warn(
      'WHATSAPP',
      `WHATSAPP_PROVIDER diset ke '${chosenName}', tetapi FONNTE_TOKEN belum lengkap. Beralih ke mode demo.`
    );
    return providers.demo;
  }

  if (providers.fonnte.isConfigured()) {
    return providers.fonnte;
  }

  return providers.demo;
}

/**
 * Mendapatkan provider spesifik berdasarkan nama.
 * @param {string} name
 */
export function getProviderByName(name) {
  const key = String(name || '').trim().toLowerCase();
  return providers[key] || null;
}

/**
 * Mendapatkan daftar seluruh provider yang didukung beserta status konfigurasinya.
 */
export function listSupportedProviders() {
  return [
    {
      id: 'fonnte',
      name: 'Fonnte (Indonesia)',
      isConfigured: providers.fonnte.isConfigured(),
      requiredEnv: ['FONNTE_TOKEN']
    },
    {
      id: 'demo',
      name: 'Demo Mode (Lokal / Log Konsol)',
      isConfigured: true,
      requiredEnv: []
    }
  ];
}
