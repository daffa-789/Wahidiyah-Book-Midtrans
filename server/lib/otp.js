

import crypto from 'crypto';
import { isMailerConfigured, sendOtpEmail } from '../mailer.js';
import {
  deleteOtpByEmailPurpose,
  deleteOtpById,
  findLatestOtp,
  incrementOtpAttempts,
  insertOtp
} from '../otpStore.js';
import { logger } from '../logger.js';


const OTP_TTL_MS = 10 * 60 * 1000;


const OTP_RESEND_COOLDOWN_MS = 60 * 1000;


const OTP_MAX_ATTEMPTS = 5;

const hashOtp = (email, purpose, code) =>
  crypto.createHash('sha256').update(`${purpose}:${email}:${code}`).digest('hex');


export const canExposeDevOtp = () => process.env.NODE_ENV === 'development';


export function resendCooldownRemaining(row) {
  if (!row?.created_at) return 0;
  const issuedAt = new Date(row.created_at).getTime();
  if (Number.isNaN(issuedAt)) return 0;
  const elapsed = Date.now() - issuedAt;
  if (elapsed >= OTP_RESEND_COOLDOWN_MS) return 0;
  return Math.ceil((OTP_RESEND_COOLDOWN_MS - elapsed) / 1000);
}


export async function issueOtp({ email, purpose, payload = null }) {
  const code = String(crypto.randomInt(100000, 1000000));

  await deleteOtpByEmailPurpose(email, purpose);
  await insertOtp({
    email,
    purpose,
    codeHash: hashOtp(email, purpose, code),
    payload,
    expiresAt: new Date(Date.now() + OTP_TTL_MS).toISOString()
  });

  let deliveredBy = 'demo';
  if (isMailerConfigured()) {
    try {
      await sendOtpEmail(email, code, purpose);
      deliveredBy = 'email';
    } catch (mailError) {
      logger.error('MAIL', 'Gagal mengirim kode, memakai mode pengembangan', {
        pesan: mailError.message
      });
    }
  }
  return { code, deliveredBy };
}


export async function consumeOtp({ email, purpose, code }) {
  const row = await findLatestOtp(email, purpose);

  if (!row) {
    return { ok: false, status: 400, message: 'Kode verifikasi tidak ditemukan. Minta kode baru terlebih dahulu.' };
  }
  if ((row.attempts || 0) >= OTP_MAX_ATTEMPTS) {
    await deleteOtpById(row.id);
    return { ok: false, status: 429, message: 'Percobaan kode terlalu banyak. Minta kode baru.' };
  }
  if (new Date(row.expires_at).getTime() < Date.now()) {
    await deleteOtpById(row.id);
    return { ok: false, status: 400, message: 'Kode verifikasi sudah kedaluwarsa. Minta kode baru.' };
  }
  if (hashOtp(email, purpose, code) !== row.code_hash) {
    await incrementOtpAttempts(row.id);
    return { ok: false, status: 400, message: 'Kode verifikasi salah.' };
  }
  return { ok: true, row };
}
