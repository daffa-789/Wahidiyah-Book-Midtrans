import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from './logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });
dotenv.config();

const FONNTE_TOKEN = process.env.FONNTE_TOKEN || '';
const FONNTE_API_URL = 'https://api.fonnte.com/send';

/**
 * Normalisasi nomor HP Indonesia ke format standar internasional (628xxx).
 * Contoh:
 *  - '08123456789'  -> '628123456789'
 *  - '+62812345678' -> '62812345678'
 *  - '8123456789'   -> '628123456789'
 */
export const normalizePhone = (raw) => {
  if (!raw) return '';
  let cleaned = String(raw).trim().replace(/[^0-9+]/g, '');
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.slice(1);
  }
  if (cleaned.startsWith('08')) {
    cleaned = '62' + cleaned.slice(1);
  } else if (cleaned.startsWith('8')) {
    cleaned = '62' + cleaned;
  }
  return cleaned;
};

/**
 * Validasi nomor HP Indonesia.
 * Wajib diawali 628 dan panjang antara 10 sampai 15 digit.
 */
export const isValidPhone = (raw) => {
  const normalized = normalizePhone(raw);
  return /^628[1-9][0-9]{7,12}$/.test(normalized);
};

export const isWhatsAppConfigured = () => Boolean(FONNTE_TOKEN);

/**
 * Mengirim pesan WhatsApp berisi kode OTP.
 * Jika FONNTE_TOKEN belum diisi, otomatis berjalan dalam mode demo/development.
 */
export async function sendOtpWhatsApp({ phone, code, purpose = 'register' }) {
  const normalized = normalizePhone(phone);
  if (!normalized) {
    throw new Error('Nomor telepon tujuan tidak valid.');
  }

  const isRegister = purpose === 'register';
  const actionText = isRegister ? 'pendaftaran akun' : 'pemulihan (reset password)';
  const message =
    `*Assalamu'alaikum Warahmatullahi Wabarakatuh*\n\n` +
    `Kode verifikasi ${actionText} *Buku Wahidiyah* Anda adalah:\n\n` +
    `🔑 *${code}*\n\n` +
    `_Kode ini bersifat rahasia dan berlaku selama 10 menit._\n` +
    `Jangan berikan kode ini kepada siapa pun termasuk pihak pengelola.\n\n` +
    `Terima kasih.`;

  if (isWhatsAppConfigured()) {
    try {
      const response = await fetch(FONNTE_API_URL, {
        method: 'POST',
        headers: {
          Authorization: FONNTE_TOKEN,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          target: normalized,
          message: message,
          countryCode: '62'
        })
      });

      const resJson = await response.json().catch(() => ({}));
      if (!response.ok || resJson.status === false) {
        throw new Error(resJson.reason || resJson.message || `HTTP ${response.status}`);
      }

      logger.ok('WHATSAPP', `OTP berhasil terkirim via Fonnte ke ${normalized}`, {
        purpose,
        provider: 'fonnte'
      });
      return { deliveredBy: 'whatsapp', success: true };
    } catch (err) {
      logger.error('WHATSAPP', `Gagal kirim via gateway WA (${err.message}). Menggunakan mode demo.`, {
        phone: normalized
      });
      return { deliveredBy: 'demo', success: false, error: err.message };
    }
  }

  // Fallback demo/development
  logger.info('WHATSAPP', `[DEMO OTP] Pesan ke ${normalized}: Kode = ${code}`, {
    purpose,
    mode: 'demo (FONNTE_TOKEN belum diisi)'
  });
  return { deliveredBy: 'demo', success: true };
}
