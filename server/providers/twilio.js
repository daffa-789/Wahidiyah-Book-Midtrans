import { BaseWhatsAppProvider } from './base.js';
import { logger } from '../logger.js';

/**
 * TwilioProvider
 * Integrasi resmi Twilio WhatsApp API (https://twilio.com).
 */
export class TwilioProvider extends BaseWhatsAppProvider {
  constructor() {
    super('twilio');
  }

  getConfig() {
    return {
      accountSid: (process.env.TWILIO_ACCOUNT_SID || '').trim(),
      authToken: (process.env.TWILIO_AUTH_TOKEN || '').trim(),
      fromNumber: (process.env.TWILIO_WHATSAPP_NUMBER || '').trim()
    };
  }

  isConfigured() {
    const { accountSid, authToken, fromNumber } = this.getConfig();
    return Boolean(accountSid && authToken && fromNumber);
  }

  async sendOtp({ phone, code, purpose = 'register' }) {
    const { accountSid, authToken, fromNumber } = this.getConfig();
    if (!accountSid || !authToken || !fromNumber) {
      throw new Error('TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, atau TWILIO_WHATSAPP_NUMBER belum lengkap di file .env');
    }

    const message = this.formatMessage({ code, purpose });
    const apiUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

    const formattedFrom = fromNumber.startsWith('whatsapp:') ? fromNumber : `whatsapp:${fromNumber}`;
    const formattedTo = phone.startsWith('whatsapp:') ? phone : `whatsapp:+${phone}`;

    const params = new URLSearchParams({
      From: formattedFrom,
      To: formattedTo,
      Body: message
    });

    const authHeader = 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64');

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });

    const resJson = await response.json().catch(() => ({}));
    if (!response.ok || resJson.error_code) {
      const errorMsg = resJson.message || `HTTP ${response.status}`;
      throw new Error(`Twilio API Error: ${errorMsg}`);
    }

    logger.ok('WHATSAPP', `OTP berhasil terkirim via Twilio ke ${phone}`, {
      purpose,
      provider: 'twilio',
      sid: resJson.sid
    });

    return {
      success: true,
      deliveredBy: 'whatsapp',
      provider: 'twilio',
      messageId: resJson.sid
    };
  }
}
