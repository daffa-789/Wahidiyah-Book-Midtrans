

import { Router } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { supabaseServer } from '../db.js';
import {
  createSessionToken,
  generateId,
  hashPassword,
  normalizeEmail,
  requireAuth,
  toPublicUser,
  verifyPassword
} from '../auth.js';
import {
  authFailureMessage,
  DB_DOWN_MESSAGE,
  internalErrorDetail,
  isDbDown,
  wrap
} from '../lib/http.js';
import { canExposeDevOtp, consumeOtp, issueOtp, resendCooldownRemaining } from '../lib/otp.js';
import { findLatestOtp, deleteOtpByEmailPurpose, deleteOtpById } from '../otpStore.js';
import { sendGoogleAccountEmail, isMailerConfigured } from '../mailer.js';
import { logger } from '../logger.js';
import { loginSchema, registerSchema } from '../lib/validate.js';

export const authRouter = Router();

const replyAuthFailure = (res, error, { dbMessage = DB_DOWN_MESSAGE } = {}) => {
  const isDbError = isDbDown(error);
  return res.status(isDbError ? 503 : 500).json({
    success: false,
    message: isDbError ? dbMessage : authFailureMessage(error),
    error: internalErrorDetail(error),
    isDatabaseError: isDbError
  });
};

const INVALID_CREDENTIALS_MESSAGE =
  'Email atau password belum sesuai. Jika Anda menggunakan akun Google, silakan klik tombol "Login dengan Google" di bawah.';

const GOOGLE_ACCOUNT_MESSAGE =
  'Akun ini terdaftar lewat Google. Silakan klik tombol "Login dengan Google" di bawah.';

authRouter.post('/login', async (req, res) => {
  const { identifier, email, password } = req.body;
  const userEmail = normalizeEmail(email || identifier);

  const parsed = loginSchema.safeParse({ email: userEmail, password });
  if (!parsed.success) {
    return res.status(400).json({ success: false, message: parsed.error.issues[0]?.message || 'Input tidak valid' });
  }

  try {
    const { data: user, error: lookupError } = await supabaseServer
      .from('users')
      .select('*')
      .eq('email', userEmail)
      .maybeSingle();

    if (lookupError) throw lookupError;
    if (!user) return res.status(401).json({ success: false, message: INVALID_CREDENTIALS_MESSAGE });

    const passwordOk = await verifyPassword(password, user.password);
    if (!passwordOk) {
      return res.status(401).json({
        success: false,
        message: user.password ? INVALID_CREDENTIALS_MESSAGE : GOOGLE_ACCOUNT_MESSAGE
      });
    }

    logger.ok('AUTH', 'Login berhasil', { email: userEmail, role: user.role || 'user' });

    res.json({
      success: true,
      message: 'Login berhasil',
      token: createSessionToken(user),
      user: toPublicUser(user)
    });
  } catch (error) {
    return replyAuthFailure(res, error);
  }
});

authRouter.post('/register', async (req, res) => {
  try {
    const { name, email, password, dob } = req.body;
    const normalizedEmail = normalizeEmail(email);

    const parsed = registerSchema.safeParse({ name, email: normalizedEmail, password, dob });
    if (!parsed.success) {
      return res.status(400).json({ success: false, message: parsed.error.issues[0]?.message || 'Input tidak valid' });
    }

    const { data: existing } = await supabaseServer
      .from('users')
      .select('id')
      .eq('email', normalizedEmail)
      .maybeSingle();
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email sudah terdaftar. Silakan masuk atau gunakan email lain.' });
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

    return res.status(202).json({
      success: true,
      message: 'Kode verifikasi telah dikirim ke email Anda dan berlaku 10 menit.',
      email: normalizedEmail,
      devOtp: deliveredBy === 'demo' && canExposeDevOtp() ? code : undefined
    });
  } catch (error) {
    return replyAuthFailure(res, error, { dbMessage: 'Gagal terhubung ke database.' });
  }
});

authRouter.post('/verify-registration', async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const code = String(req.body?.code || '').trim();
    if (!email || !code) {
      return res.status(400).json({ success: false, message: 'Email dan kode verifikasi wajib diisi.' });
    }

    const result = await consumeOtp({ email, purpose: 'register', code });
    if (!result.ok) {
      return res.status(result.status).json({ success: false, message: result.message });
    }

    const payload = result.row.payload || {};
    if (!payload.name || !payload.passwordHash) {
      await deleteOtpById(result.row.id);
      return res.status(400).json({ success: false, message: 'Data pendaftaran tidak lengkap. Silakan daftar ulang.' });
    }

    const newId = generateId('usr');
    const newUser = {
      id: newId,
      name: payload.name,
      email,
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
        return res.status(409).json({ success: false, message: 'Email sudah terdaftar. Silakan masuk.' });
      }
      throw insertError;
    }

    await deleteOtpById(result.row.id);

    logger.ok('AUTH', 'Registrasi akun baru (email terverifikasi)', { email, id: newId });

    return res.status(201).json({
      success: true,
      message: 'Akun berhasil dibuat.',
      token: createSessionToken(newUser),
      user: toPublicUser(newUser)
    });
  } catch (error) {
    return replyAuthFailure(res, error, { dbMessage: 'Gagal terhubung ke database.' });
  }
});

const RESET_UNIFORM_RESPONSE = {
  success: true,
  message: 'Jika email tersebut terdaftar, kode pemulihan telah dikirim dan berlaku 10 menit.'
};

authRouter.post('/request-password-reset', wrap(async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  if (!email || !email.includes('@')) {
    return res.status(400).json({ success: false, message: 'Masukkan alamat email yang valid.' });
  }

  const { data: account } = await supabaseServer
    .from('users')
    .select('id, login_method')
    .eq('email', email)
    .maybeSingle();

  if (!account) {
    logger.info('OTP', 'Permintaan reset untuk email tak terdaftar (respons disamakan)', { email });
    return res.json(RESET_UNIFORM_RESPONSE);
  }

  if (account.login_method === 'google') {
    let deliveredBy = 'demo';
    if (isMailerConfigured()) {
      try {
        await sendGoogleAccountEmail(email);
        deliveredBy = 'email';
      } catch (mailError) {
        logger.error('MAIL', 'Gagal mengirim pemberitahuan akun Google', { pesan: mailError.message });
      }
    }
    logger.info('OTP', 'Reset password ditolak: akun terdaftar lewat Google', { email, deliveredBy });
    return res.json(RESET_UNIFORM_RESPONSE);
  }

  const { code, deliveredBy } = await issueOtp({ email, purpose: 'reset' });
  const exposeDevOtp = deliveredBy === 'demo' && canExposeDevOtp();

  logger.info('OTP', 'Permintaan reset password', { email, deliveredBy, devOtpExposed: exposeDevOtp });

  return res.json({ ...RESET_UNIFORM_RESPONSE, devOtp: exposeDevOtp ? code : undefined });
}));

authRouter.post('/reset-password', wrap(async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const code = String(req.body?.code || '').trim();
  const password = String(req.body?.password || '');

  if (!email || !code) {
    return res.status(400).json({ success: false, message: 'Email dan kode verifikasi wajib diisi.' });
  }
  if (password.length < 8) {
    return res.status(400).json({ success: false, message: 'Password baru minimal 8 karakter.' });
  }

  const { data: target } = await supabaseServer
    .from('users')
    .select('login_method')
    .eq('email', email)
    .maybeSingle();
  if (target?.login_method === 'google') {
    await deleteOtpByEmailPurpose(email, 'reset');
    logger.warn('OTP', 'Reset password ditolak: akun terdaftar lewat Google', { email });
    return res.status(400).json({
      success: false,
      message: 'Akun ini terdaftar melalui Google sehingga tidak memiliki password. Silakan masuk dengan tombol "Login dengan Google".'
    });
  }

  const result = await consumeOtp({ email, purpose: 'reset', code });
  if (!result.ok) {
    return res.status(result.status).json({ success: false, message: result.message });
  }

  await deleteOtpById(result.row.id);
  await supabaseServer
    .from('users')
    .update({ password: await hashPassword(password) })
    .eq('email', email);

  logger.ok('OTP', 'Password berhasil direset', { email });
  return res.json({ success: true, message: 'Password berhasil diperbarui.' });
}));

authRouter.post('/resend-verification', wrap(async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const purpose = req.body?.purpose === 'reset' ? 'reset' : 'register';

  if (!email || !email.includes('@')) {
    return res.status(400).json({ success: false, message: 'Email tidak valid.' });
  }

  const existing = await findLatestOtp(email, purpose);
  if (!existing) {
    return res.status(400).json({
      success: false,
      message: 'Tidak ada permintaan verifikasi yang aktif. Silakan ulangi dari awal.'
    });
  }
  if (purpose === 'register' && !existing.payload) {
    return res.status(400).json({
      success: false,
      message: 'Data pendaftaran tidak ditemukan. Silakan daftar ulang dari awal.'
    });
  }

  const cooldown = resendCooldownRemaining(existing);
  if (cooldown > 0) {
    return res.status(429).json({
      success: false,
      retryAfterSeconds: cooldown,
      message: `Mohon tunggu ${cooldown} detik sebelum meminta kode baru.`
    });
  }

  if (purpose === 'reset') {
    const { data: account } = await supabaseServer
      .from('users')
      .select('login_method')
      .eq('email', email)
      .maybeSingle();
    if (!account || account.login_method === 'google') {
      return res.json(RESET_UNIFORM_RESPONSE);
    }
  }

  const { code, deliveredBy } = await issueOtp({
    email,
    purpose,
    payload: existing.payload ?? null
  });
  const exposeDevOtp = deliveredBy === 'demo' && canExposeDevOtp();

  logger.info('OTP', 'Kode dikirim ulang', { email, purpose, deliveredBy });

  return res.json({
    success: true,
    message: 'Kode baru telah dikirim dan berlaku 10 menit.',
    email,
    devOtp: exposeDevOtp ? code : undefined
  });
}));

authRouter.post('/google-supabase', async (req, res) => {
  const { access_token, user: googleUser } = req.body;
  if (!access_token || !googleUser?.email) {
    return res.status(400).json({ success: false, message: 'Token dan informasi akun Google wajib diisi.' });
  }

  try {

    const { createClient } = await import('@supabase/supabase-js');
    const supaUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supaAnonKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    const supaAuth = createClient(supaUrl, supaAnonKey);
    const { data: { user: supaUser }, error: authError } = await supaAuth.auth.getUser(access_token);
    if (authError || !supaUser) {
      return res.status(401).json({ success: false, message: 'Token Google tidak valid atau sudah kedaluwarsa.' });
    }

    const email = normalizeEmail(supaUser.email);

    let { data: existingUser } = await supabaseServer
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (!existingUser) {
      const newId = generateId('usr');
      const newUser = {
        id: newId,
        name: googleUser.name || email.split('@')[0],
        email,
        password: null,
        role: 'user',
        login_method: 'google',
        is_pro: false,
        avatar: googleUser.avatar || null,
      };
      const { error: insertError } = await supabaseServer.from('users').insert([newUser]);
      if (insertError) {

        if (insertError.code === '23505') {
          const { data: raceUser } = await supabaseServer
            .from('users').select('*').eq('email', email).maybeSingle();
          existingUser = raceUser;
        } else {
          throw insertError;
        }
      } else {
        existingUser = newUser;
      }
      logger.ok('AUTH', 'Registrasi akun baru via Google (Supabase Auth)', { email, id: existingUser.id });
    } else {
      logger.ok('AUTH', 'Login via Google (Supabase Auth)', { email, role: existingUser.role || 'user' });
    }

    res.json({
      success: true,
      message: 'Login Google berhasil.',
      token: createSessionToken(existingUser),
      user: toPublicUser(existingUser),
    });
  } catch (error) {
    return replyAuthFailure(res, error);
  }
});

const parseCookies = (header) => {
  const out = {};
  if (!header) return out;
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx < 0) continue;
    const key = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (key) out[key] = decodeURIComponent(value);
  }
  return out;
};

authRouter.get('/google/callback', async (req, res) => {
  const frontendOrigin = process.env.FRONTEND_ORIGIN || `http://localhost:${process.env.VITE_PORT || 3000}`;

  const failRedirect = (message, code = 'google_oauth') => {
    try {
      const url = new URL('/login', frontendOrigin);
      url.searchParams.set('error', code);
      url.searchParams.set('message', message);
      logger.warn('GOOGLE_OAUTH', message);
      return res.redirect(url.toString());
    } catch (redirectError) {

      logger.error('GOOGLE_OAUTH', 'Gagal menyusun URL redirect', { pesan: redirectError.message });
      return res.status(302).send(`<script>window.location.href='${frontendOrigin}/login';</script>`);
    }
  };

  try {
    const { code, state, error: oauthError } = req.query;

    if (oauthError) return failRedirect(`Google mengembalikan kesalahan: ${oauthError}.`);
    if (!code) return failRedirect('Kode otorisasi tidak ditemukan.');
    if (!state) return failRedirect('State OAuth tidak ditemukan.');

    const cookies = parseCookies(req.headers.cookie || '');
    const expectedState = cookies.google_oauth_state;

    res.setHeader('Set-Cookie', 'google_oauth_state=; Path=/; Max-Age=0; SameSite=Lax');
    if (!expectedState || expectedState !== state) {
      return failRedirect('State OAuth tidak cocok (kemungkinan CSRF). Coba lagi dari halaman masuk.');
    }

    const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
    const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
    if (!CLIENT_ID || !CLIENT_SECRET) {
      return failRedirect('Konfigurasi Google OAuth di server belum lengkap.');
    }
    const REDIRECT_URI = process.env.GOOGLE_OAUTH_REDIRECT_URI
      || `${frontendOrigin}/api/auth/google/callback`;

    const oauthClient = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
    let tokens;
    try {
      const response = await oauthClient.getToken(code);
      tokens = response.tokens;
    } catch (exchangeError) {
      logger.error('GOOGLE_OAUTH', 'Penukaran code dengan token gagal', { pesan: exchangeError.message });
      return failRedirect('Penukaran kode OAuth dengan Google gagal.');
    }
    if (!tokens?.id_token) {
      return failRedirect('Google tidak mengembalikan id_token.');
    }

    let payload;
    try {
      const ticket = await oauthClient.verifyIdToken({
        idToken: tokens.id_token,
        audience: CLIENT_ID
      });
      payload = ticket.getPayload();
    } catch (verifyError) {
      logger.error('GOOGLE_OAUTH', 'Verifikasi id_token gagal', { pesan: verifyError.message });
      return failRedirect('id_token tidak valid atau tidak cocok dengan client ID kita.');
    }
    if (!payload?.email_verified) {
      return failRedirect('Email Google belum diverifikasi oleh Google.');
    }

    const email = normalizeEmail(payload.email);
    if (!email) return failRedirect('Email Google kosong.');

    let { data: existingUser } = await supabaseServer
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (!existingUser) {
      const newId = generateId('usr');
      const newUser = {
        id: newId,
        name: payload.name || email.split('@')[0],
        email,
        password: null,
        role: 'user',
        login_method: 'google',
        is_pro: false,
        avatar: payload.picture || null
      };
      const { error: insertError } = await supabaseServer.from('users').insert([newUser]);
      if (insertError) {

        if (insertError.code === '23505') {
          const { data: raceUser } = await supabaseServer
            .from('users').select('*').eq('email', email).maybeSingle();
          existingUser = raceUser;
        } else {
          throw insertError;
        }
      } else {
        existingUser = newUser;
      }
      logger.ok('AUTH', 'Registrasi akun baru via Google (direct OAuth)', { email, id: existingUser.id });
    } else {
      logger.ok('AUTH', 'Login via Google (direct OAuth)', { email, role: existingUser.role || 'user' });
    }

    if (!existingUser) {
      return failRedirect('Gagal membuat atau mengambil akun Google.');
    }

    const token = createSessionToken(existingUser);
    const user = toPublicUser(existingUser);
    const userJson = Buffer.from(JSON.stringify(user), 'utf8').toString('base64url');

    const successUrl = new URL('/auth/success', frontendOrigin);
    successUrl.searchParams.set('token', token);
    successUrl.searchParams.set('user', userJson);

    return res.redirect(successUrl.toString());
  } catch (error) {
    return replyAuthFailure(res, error);
  }
});

authRouter.get('/me', requireAuth, async (req, res) => {
  try {
    const { data: user } = await supabaseServer
      .from('users')
      .select('*')
      .eq('id', req.user.id)
      .maybeSingle();
    res.json({ success: true, user: toPublicUser(user || req.authUser) });
  } catch (error) {
    res.json({ success: true, user: toPublicUser(req.authUser) });
  }
});
