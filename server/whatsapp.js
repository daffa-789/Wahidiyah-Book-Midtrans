import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from './logger.js';
import {
  getActiveWhatsAppProvider,
  getProviderByName,
  listSupportedProviders
} from './providers/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });
dotenv.config();

/**
 * Normalisasi nomor HP (Indonesia maupun internasional) ke format standar angka (E.164 tanpa +).
 * Contoh:
 *  - '08123456789'   -> '628123456789'
 *  - '+62812345678'  -> '62812345678'
 *  - '+60123456789'  -> '60123456789'
 *  - '8123456789'    -> '628123456789'
 */
export const normalizePhone = (raw) => {
  if (!raw) return '';
  let cleaned = String(raw).trim().replace(/[^0-9+]/g, '');
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.slice(1);
  }
  if (cleaned.startsWith('08')) {
    cleaned = '62' + cleaned.slice(1);
  } else if (cleaned.startsWith('8') && cleaned.length >= 9 && cleaned.length <= 13) {
    cleaned = '62' + cleaned;
  }
  return cleaned;
};

/**
 * Validasi nomor HP (mendukung Indonesia 628xxx maupun format internasional 8-15 digit).
 */
export const isValidPhone = (raw) => {
  const normalized = normalizePhone(raw);
  // Standar E.164 tanpa tanda plus: 8 sampai 15 digit angka, tidak diawali 0
  return /^[1-9][0-9]{7,14}$/.test(normalized);
};

/**
 * Memeriksa apakah provider WhatsApp aktif sudah terkonfigurasi secara nyata
 * (bukan sekadar fallback mode demo).
 */
export const isWhatsAppConfigured = () => {
  const active = getActiveWhatsAppProvider();
  return active.isConfigured() && active.name !== 'demo';
};

/**
 * Mendapatkan informasi metadata provider yang sedang aktif.
 */
export const getWhatsAppProviderInfo = () => {
  const active = getActiveWhatsAppProvider();
  return {
    activeProvider: active.name,
    isConfigured: isWhatsAppConfigured(),
    supportedProviders: listSupportedProviders()
  };
};

/**
 * Mengirim pesan WhatsApp berisi kode OTP menggunakan provider aktif.
 * Mendukung Fonnte, Wablas, Whacenter, Twilio, Webhook custom, serta mode demo.
 */
export async function sendOtpWhatsApp({ phone, code, purpose = 'register' }) {
  const normalized = normalizePhone(phone);
  if (!normalized) {
    throw new Error('Nomor telepon tujuan tidak valid.');
  }

  const provider = getActiveWhatsAppProvider();

  // Jika provider nyata aktif dan terkonfigurasi, coba kirim
  if (provider.isConfigured() && provider.name !== 'demo') {
    try {
      const result = await provider.sendOtp({ phone: normalized, code, purpose });
      return result;
    } catch (err) {
      logger.error('WHATSAPP', `Gagal kirim via gateway WA ${provider.name} (${err.message}). Menggunakan mode demo.`, {
        phone: normalized,
        provider: provider.name
      });
      return { deliveredBy: 'demo', success: false, error: err.message };
    }
  }

  // Fallback demo/development jika belum ada kredensial gateway yang aktif
  const demoResult = await getProviderByName('demo').sendOtp({ phone: normalized, code, purpose });
  return demoResult;
}

export { getActiveWhatsAppProvider, listSupportedProviders, getProviderByName };
