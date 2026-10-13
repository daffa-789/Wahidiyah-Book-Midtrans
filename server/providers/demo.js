import { BaseWhatsAppProvider } from './base.js';
import { logger } from '../logger.js';

/**
 * DemoProvider
 * Mode simulasi / pengembangan lokal jika tidak ada kredensial WhatsApp gateway yang aktif.
 * Kode OTP akan dicetak ke log konsol server agar pengembang tetap dapat menguji registrasi.
 */
export class DemoProvider extends BaseWhatsAppProvider {
  constructor() {
    super('demo');
  }

  isConfigured() {
    return true;
  }

  async sendOtp({ phone, code, purpose = 'register' }) {
    logger.info('WHATSAPP', `[DEMO OTP] Pesan ke ${phone}: Kode = ${code}`, {
      purpose,
      mode: 'demo (kredensial gateway belum diisi atau provider=demo)'
    });

    return {
      success: true,
      deliveredBy: 'demo',
      provider: 'demo',
      demoCode: code
    };
  }
}
