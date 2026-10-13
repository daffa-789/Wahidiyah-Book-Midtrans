import { BaseWhatsAppProvider } from './base.js';
import { logger } from '../logger.js';

/**
 * GenericWebhookProvider
 * Memungkinkan menghubungkan bot WhatsApp custom apa pun (Baileys, whatsapp-web.js,
 * microservice internal, n8n, Zapier, dsb.) cukup dengan menentukan URL webhook.
 */
export class GenericWebhookProvider extends BaseWhatsAppProvider {
  constructor() {
    super('webhook');
  }

  getWebhookUrl() {
    return (process.env.WHATSAPP_WEBHOOK_URL || '').trim();
  }

  getSecret() {
    return (process.env.WHATSAPP_WEBHOOK_SECRET || '').trim();
  }

  isConfigured() {
    return Boolean(this.getWebhookUrl());
  }

  async sendOtp({ phone, code, purpose = 'register' }) {
    const url = this.getWebhookUrl();
    if (!url) {
      throw new Error('WHATSAPP_WEBHOOK_URL belum dikonfigurasi di file .env');
    }

    const message = this.formatMessage({ code, purpose });
    const secret = this.getSecret();

    const headers = {
      'Content-Type': 'application/json'
    };
    if (secret) {
      headers['X-Webhook-Secret'] = secret;
      headers['Authorization'] = `Bearer ${secret}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        phone,
        code,
        purpose,
        message,
        timestamp: new Date().toISOString()
      })
    });

    const resJson = await response.json().catch(() => ({}));
    if (!response.ok || resJson.success === false || resJson.status === false) {
      const errorMsg = resJson.message || resJson.error || `HTTP ${response.status}`;
      throw new Error(`Custom Webhook Error: ${errorMsg}`);
    }

    logger.ok('WHATSAPP', `OTP berhasil terkirim via Webhook Custom ke ${phone}`, {
      purpose,
      provider: 'webhook',
      url
    });

    return {
      success: true,
      deliveredBy: 'whatsapp',
      provider: 'webhook',
      messageId: resJson.id || resJson.messageId
    };
  }
}
