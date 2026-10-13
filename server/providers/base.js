/**
 * BaseWhatsAppProvider
 * Kelas dasar (interface) untuk semua penyedia gateway WhatsApp.
 */
export class BaseWhatsAppProvider {
  constructor(name) {
    this.name = name;
  }

  /**
   * Menentukan apakah provider ini sudah terkonfigurasi (misal token sudah diisi).
   * @returns {boolean}
   */
  isConfigured() {
    return false;
  }

  /**
   * Format template pesan WhatsApp standar untuk kode OTP Buku Wahidiyah.
   */
  formatMessage({ code, purpose = 'register' }) {
    const isRegister = purpose === 'register';
    const actionText = isRegister ? 'pendaftaran akun' : 'pemulihan (reset password)';
    return (
      `*Assalamu'alaikum Warahmatullahi Wabarakatuh*\n\n` +
      `Kode verifikasi ${actionText} *Buku Wahidiyah* Anda adalah:\n\n` +
      `🔑 *${code}*\n\n` +
      `_Kode ini bersifat rahasia dan berlaku selama 10 menit._\n` +
      `Jangan berikan kode ini kepada siapa pun termasuk pihak pengelola.\n\n` +
      `Terima kasih.`
    );
  }

  /**
   * Mengirim kode OTP ke nomor tujuan.
   * Harus di-override oleh kelas turunan.
   *
   * @param {object} params
   * @param {string} params.phone - Nomor tujuan (E.164 tanpa +)
   * @param {string} params.code - Kode OTP (6 angka)
   * @param {string} [params.purpose] - Tujuan ('register' | 'reset')
   * @returns {Promise<{ success: boolean, deliveredBy: string, provider: string, messageId?: string, error?: string }>}
   */
  async sendOtp({ phone, code, purpose = 'register' }) {
    throw new Error(`Method sendOtp() belum diimplementasikan untuk provider ${this.name}`);
  }
}
