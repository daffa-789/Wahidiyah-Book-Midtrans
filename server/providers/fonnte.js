import { BaseWhatsAppProvider } from './base.js';
import { logger } from '../logger.js';

/**
 * FonnteProvider
 * Integrasi resmi Fonnte WhatsApp API Gateway (https://fonnte.com).
 */
export class FonnteProvider extends BaseWhatsAppProvider {
  constructor() {
    super('fonnte');
    this.apiUrl = 'https://api.fonnte.com/send';
  }

  getToken() {
    return (process.env.FONNTE_TOKEN || '').trim();
  }

  isConfigured() {
    return Boolean(this.getToken());
  }

  async sendOtp({ phone, code, purpose = 'register' }) {
    const token = this.getToken();
    if (!token) {
      throw new Error('FONNTE_TOKEN belum dikonfigurasi di file .env');
    }

    const message = this.formatMessage({ code, purpose });

    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        Authorization: token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        target: phone,
        message: message,
        countryCode: '62',
      }),
    });

    const resJson = await response.json().catch(() => ({}));
    if (!response.ok || resJson.status === false) {
      const errorMsg = resJson.reason || resJson.message || `HTTP ${response.status}`;
      throw new Error(`Fonnte API Error: ${errorMsg}`);
    }

    const messageId = Array.isArray(resJson.id) ? resJson.id[0] : resJson.id;

    logger.ok('WHATSAPP', `OTP berhasil terkirim via Fonnte ke ${phone}`, {
      purpose,
      provider: 'fonnte',
      messageId,
    });

    return {
      success: true,
      deliveredBy: 'whatsapp',
      provider: 'fonnte',
      messageId,
    };
  }
}
