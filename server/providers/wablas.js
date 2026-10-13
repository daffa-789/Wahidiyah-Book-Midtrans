import { BaseWhatsAppProvider } from './base.js';
import { logger } from '../logger.js';

/**
 * WablasProvider
 * Integrasi WhatsApp Gateway Wablas (https://wablas.com).
 */
export class WablasProvider extends BaseWhatsAppProvider {
  constructor() {
    super('wablas');
  }

  getToken() {
    return (process.env.WABLAS_TOKEN || '').trim();
  }

  getServerUrl() {
    let server = (process.env.WABLAS_SERVER || 'https://jakarta.wablas.com').trim();
    if (server.endsWith('/')) {
      server = server.slice(0, -1);
    }
    return `${server}/api/send-message`;
  }

  isConfigured() {
    return Boolean(this.getToken());
  }

  async sendOtp({ phone, code, purpose = 'register' }) {
    const token = this.getToken();
    if (!token) {
      throw new Error('WABLAS_TOKEN belum dikonfigurasi di file .env');
    }

    const message = this.formatMessage({ code, purpose });
    const apiUrl = this.getServerUrl();

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        Authorization: token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phone: phone,
        message: message
      })
    });

    const resJson = await response.json().catch(() => ({}));
    if (!response.ok || resJson.status === false) {
      const errorMsg = resJson.message || `HTTP ${response.status}`;
      throw new Error(`Wablas API Error: ${errorMsg}`);
    }

    const messageId = resJson.data?.id || resJson.data?.messages?.[0]?.id;

    logger.ok('WHATSAPP', `OTP berhasil terkirim via Wablas ke ${phone}`, {
      purpose,
      provider: 'wablas',
      messageId
    });

    return {
      success: true,
      deliveredBy: 'whatsapp',
      provider: 'wablas',
      messageId
    };
  }
}
