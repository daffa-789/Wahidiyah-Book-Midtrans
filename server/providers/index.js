import { FonnteProvider } from './fonnte.js';
import { WablasProvider } from './wablas.js';
import { WhacenterProvider } from './whacenter.js';
import { TwilioProvider } from './twilio.js';
import { GenericWebhookProvider } from './webhook.js';
import { DemoProvider } from './demo.js';
import { logger } from '../logger.js';

// Instansiasi singleton untuk setiap provider
const providers = {
  fonnte: new FonnteProvider(),
  wablas: new WablasProvider(),
  whacenter: new WhacenterProvider(),
  twilio: new TwilioProvider(),
  webhook: new GenericWebhookProvider(),
  demo: new DemoProvider()
};

/**
 * Mendapatkan provider WhatsApp yang aktif berdasarkan pengaturan di .env.
 * 
 * Prioritas pemilihan:
 * 1. Jika env WHATSAPP_PROVIDER diisi (misal 'fonnte', 'wablas', 'whacenter', 'twilio', 'webhook', 'demo').
 * 2. Auto-detect otomatis jika salah satu token/kredensial terdeteksi di .env.
 * 3. Fallback ke DemoProvider jika tidak ada kredensial gateway yang aktif.
 *
 * @returns {import('./base.js').BaseWhatsAppProvider}
 */
export function getActiveWhatsAppProvider() {
  const chosenName = (process.env.WHATSAPP_PROVIDER || '').trim().toLowerCase();

  // 1. Jika ditentukan secara eksplisit di .env
  if (chosenName && providers[chosenName]) {
    const provider = providers[chosenName];
    if (provider.isConfigured()) {
      return provider;
    }
    logger.warn(
      'WHATSAPP',
      `WHATSAPP_PROVIDER diset ke '${chosenName}', tetapi kredensialnya belum lengkap. Beralih sementara ke mode demo.`
    );
    return providers.demo;
  }

  // 2. Auto-detect berdasarkan kredensial yang ada
  if (providers.fonnte.isConfigured()) {
    return providers.fonnte;
  }
  if (providers.wablas.isConfigured()) {
    return providers.wablas;
  }
  if (providers.whacenter.isConfigured()) {
    return providers.whacenter;
  }
  if (providers.twilio.isConfigured()) {
    return providers.twilio;
  }
  if (providers.webhook.isConfigured()) {
    return providers.webhook;
  }

  // 3. Fallback ke demo
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
      id: 'wablas',
      name: 'Wablas (Indonesia)',
      isConfigured: providers.wablas.isConfigured(),
      requiredEnv: ['WABLAS_TOKEN', 'WABLAS_SERVER (opsional)']
    },
    {
      id: 'whacenter',
      name: 'Whacenter (Indonesia)',
      isConfigured: providers.whacenter.isConfigured(),
      requiredEnv: ['WHACENTER_DEVICE_ID']
    },
    {
      id: 'twilio',
      name: 'Twilio WhatsApp (Global)',
      isConfigured: providers.twilio.isConfigured(),
      requiredEnv: ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_WHATSAPP_NUMBER']
    },
    {
      id: 'webhook',
      name: 'Custom Webhook / Baileys Bot',
      isConfigured: providers.webhook.isConfigured(),
      requiredEnv: ['WHATSAPP_WEBHOOK_URL', 'WHATSAPP_WEBHOOK_SECRET (opsional)']
    },
    {
      id: 'demo',
      name: 'Demo Mode (Lokal / Log Konsol)',
      isConfigured: true,
      requiredEnv: []
    }
  ];
}
