import { BaseWhatsAppProvider } from './base.js';
import { logger } from '../logger.js';

/**
 * WhacenterProvider
 * Integrasi WhatsApp Gateway Whacenter (https://whacenter.com).
 */
export class WhacenterProvider extends BaseWhatsAppProvider {
  constructor() {
    super('whacenter');
    this.apiUrl = 'https://app.whacenter.com/api/send';
  }

  getDeviceId() {
    return (process.env.WHACENTER_DEVICE_ID || '').trim();
  }

  isConfigured() {
    return Boolean(this.getDeviceId());
  }

  async sendOtp({ phone, code, purpose = 'register' }) {
    const deviceId = this.getDeviceId();
    if (!deviceId) {
      throw new Error('WHACENTER_DEVICE_ID belum dikonfigurasi di file .env');
    }

    const message = this.formatMessage({ code, purpose });

    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        device_id: deviceId,
        number: phone,
        message: message
      })
    });

    const resJson = await response.json().catch(() => ({}));
    if (!response.ok || resJson.status === false) {
      const errorMsg = resJson.message || `HTTP ${response.status}`;
      throw new Error(`Whacenter API Error: ${errorMsg}`);
    }

    logger.ok('WHATSAPP', `OTP berhasil terkirim via Whacenter ke ${phone}`, {
      purpose,
      provider: 'whacenter',
      messageId: resJson.data?.id
    });

    return {
      success: true,
      deliveredBy: 'whatsapp',
      provider: 'whacenter',
      messageId: resJson.data?.id
    };
  }
}
