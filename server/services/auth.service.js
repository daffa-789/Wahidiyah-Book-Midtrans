import { supabaseServer } from '../db.js';
import {
  createSessionToken,
  generateId,
  hashPassword,
  normalizeEmail,
  toPublicUser,
  verifyPassword
} from '../auth.js';
import { canExposeDevOtp, consumeOtp, issueOtp } from '../lib/otp.js';
import { deleteOtpById } from '../otpStore.js';
import { sendGoogleAccountEmail, isMailerConfigured } from '../mailer.js';
import { logger } from '../logger.js';

export const INVALID_CREDENTIALS_MESSAGE =
  'Email atau password belum sesuai. Jika Anda menggunakan akun Google, silakan klik tombol "Login dengan Google" di bawah.';

export const GOOGLE_ACCOUNT_MESSAGE =
  'Akun ini terdaftar lewat Google. Silakan klik tombol "Login dengan Google" di bawah.';

export const authService = {
  async authenticateUser({ emailOrIdentifier, password }) {
    const userEmail = normalizeEmail(emailOrIdentifier);
    if (!userEmail || !password) {
      const err = new Error('Alamat email dan password wajib diisi');
      err.statusCode = 400;
      throw err;
    }
    if (String(password).length < 8) {
      const err = new Error('Password minimal 8 karakter');
      err.statusCode = 400;
      throw err;
    }

    const { data: user, error: lookupError } = await supabaseServer
      .from('users')
      .select('*')
      .eq('email', userEmail)
      .maybeSingle();

    if (lookupError) throw lookupError;
    if (!user) {
      const err = new Error(INVALID_CREDENTIALS_MESSAGE);
      err.statusCode = 401;
      throw err;
    }

    const passwordOk = await verifyPassword(password, user.password);
    if (!passwordOk) {
      const err = new Error(user.password ? INVALID_CREDENTIALS_MESSAGE : GOOGLE_ACCOUNT_MESSAGE);
      err.statusCode = 401;
      throw err;
    }

    logger.ok('AUTH', 'Login berhasil', { email: userEmail, role: user.role || 'user' });

    return {
      token: createSessionToken(user),
      user: toPublicUser(user)
    };
  },

  async registerUserInit({ name, email, password, dob }) {
    const normalizedEmail = normalizeEmail(email);

    if (!name || !email || !password) {
      const err = new Error('Nama, email, dan password wajib diisi');
      err.statusCode = 400;
      throw err;
    }
    if (!normalizedEmail.includes('@')) {
      const err = new Error('Format email tidak valid');
      err.statusCode = 400;
      throw err;
    }
    if (String(password).length < 8) {
      const err = new Error('Password minimal 8 karakter');
      err.statusCode = 400;
      throw err;
    }

    const { data: existing } = await supabaseServer
      .from('users')
      .select('id')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (existing) {
      const err = new Error('Email sudah terdaftar. Silakan masuk atau gunakan email lain.');
      err.statusCode = 409;
      throw err;
    }

    const { code, deliveredBy } = await issueOtp({
      email: normalizedEmail,
      purpose: 'register',
      payload: {
        name: name.trim(),
        passwordHash: await hashPassword(password),
        dob: dob || null
      }
    });

    logger.info('OTP', 'Kode pendaftaran dikirim', { email: normalizedEmail, deliveredBy });

    return {
      email: normalizedEmail,
      deliveredBy,
      devOtp: deliveredBy === 'demo' && canExposeDevOtp() ? code : undefined
    };
  },

  async completeRegistration({ email, code }) {
    const normalizedEmail = normalizeEmail(email);
    const cleanCode = String(code || '').trim();

    if (!normalizedEmail || !cleanCode) {
      const err = new Error('Email dan kode verifikasi wajib diisi.');
      err.statusCode = 400;
      throw err;
    }

    const result = await consumeOtp({ email: normalizedEmail, purpose: 'register', code: cleanCode });
    if (!result.ok) {
      const err = new Error(result.message);
      err.statusCode = result.status;
      throw err;
    }

    const payload = result.row.payload || {};
    if (!payload.name || !payload.passwordHash) {
      await deleteOtpById(result.row.id);
      const err = new Error('Data pendaftaran tidak lengkap. Silakan daftar ulang.');
      err.statusCode = 400;
      throw err;
    }

    const newId = generateId('usr');
    const newUser = {
      id: newId,
      name: payload.name,
      email: normalizedEmail,
      password: payload.passwordHash,
      role: 'user',
      login_method: 'email',
      is_pro: false,
      dob: payload.dob || null
    };

    const { error: insertError } = await supabaseServer.from('users').insert([newUser]);
    if (insertError) {
      if (insertError.code === '23505') {
        await deleteOtpById(result.row.id);
        const err = new Error('Email sudah terdaftar. Silakan masuk.');
        err.statusCode = 409;
        throw err;
      }
      throw insertError;
    }

    await deleteOtpById(result.row.id);
    logger.ok('AUTH', 'Registrasi akun baru (email terverifikasi)', { email: normalizedEmail, id: newId });

    return {
      token: createSessionToken(newUser),
      user: toPublicUser(newUser)
    };
  },

  async requestPasswordReset(email) {
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      const err = new Error('Masukkan alamat email yang valid.');
      err.statusCode = 400;
      throw err;
    }

    const { data: account } = await supabaseServer
      .from('users')
      .select('id, login_method')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (!account) {
      logger.info('OTP', 'Permintaan reset untuk email tak terdaftar (respons disamakan)', { email: normalizedEmail });
      return { success: true, message: 'Jika email tersebut terdaftar, kode pemulihan telah dikirim dan berlaku 10 menit.' };
    }

    if (account.login_method === 'google') {
      let deliveredBy = 'demo';
      if (isMailerConfigured()) {
        try {
          await sendGoogleAccountEmail(normalizedEmail);
          deliveredBy = 'email';
        } catch (mailError) {
          logger.error('MAIL', 'Gagal mengirim pemberitahuan akun Google', { pesan: mailError.message });
        }
      }
      logger.info('OTP', 'Reset password ditolak: akun terdaftar lewat Google', { email: normalizedEmail, deliveredBy });
      return { success: true, message: 'Jika email tersebut terdaftar, kode pemulihan telah dikirim dan berlaku 10 menit.' };
    }

    const { code, deliveredBy } = await issueOtp({ email: normalizedEmail, purpose: 'reset' });
    const exposeDevOtp = deliveredBy === 'demo' && canExposeDevOtp();
    logger.info('OTP', 'Permintaan reset password', { email: normalizedEmail, deliveredBy, devOtpExposed: exposeDevOtp });

    return {
      success: true,
      message: 'Jika email tersebut terdaftar, kode pemulihan telah dikirim dan berlaku 10 menit.',
      devOtp: exposeDevOtp ? code : undefined
    };
  },

  async executePasswordReset({ email, code, newPassword }) {
    const normalizedEmail = normalizeEmail(email);
    const cleanCode = String(code || '').trim();
    const password = String(newPassword || '');

    if (!normalizedEmail || !cleanCode) {
      const err = new Error('Email dan kode verifikasi wajib diisi.');
      err.statusCode = 400;
      throw err;
    }
    if (password.length < 8) {
      const err = new Error('Password baru minimal 8 karakter.');
      err.statusCode = 400;
      throw err;
    }

    const { data: target } = await supabaseServer
      .from('users')
      .select('login_method')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (target?.login_method === 'google') {
      const err = new Error('Akun ini terdaftar melalui Google sehingga tidak memiliki password. Silakan masuk dengan tombol "Login dengan Google".');
      err.statusCode = 400;
      throw err;
    }

    const result = await consumeOtp({ email: normalizedEmail, purpose: 'reset', code: cleanCode });
    if (!result.ok) {
      const err = new Error(result.message);
      err.statusCode = result.status;
      throw err;
    }

    await deleteOtpById(result.row.id);
    await supabaseServer
      .from('users')
      .update({ password: await hashPassword(password) })
      .eq('email', normalizedEmail);

    logger.ok('OTP', 'Password berhasil direset', { email: normalizedEmail });
    return { success: true, message: 'Password berhasil diperbarui.' };
  }
};
