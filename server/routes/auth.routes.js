import { Router } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { supabaseServer } from '../db.js';
import {
  createSessionToken,
  generateId,
  normalizeEmail,
  requireAuth,
  toPublicUser
} from '../auth.js';
import {
  authFailureMessage,
  DB_DOWN_MESSAGE,
  internalErrorDetail,
  isDbDown,
  wrap
} from '../lib/http.js';
import { findLatestOtp, resendCooldownRemaining } from '../otpStore.js';
import { logger } from '../logger.js';
import { authService } from '../services/auth.service.js';

export const authRouter = Router();

const replyAuthFailure = (res, error, { dbMessage = DB_DOWN_MESSAGE } = {}) => {
  const isDbError = isDbDown(error);
  const status = error.statusCode || (isDbError ? 503 : 500);
  return res.status(status).json({
    success: false,
    message: isDbError ? dbMessage : (error.message || authFailureMessage(error)),
    error: internalErrorDetail(error),
    isDatabaseError: isDbError
  });
};

authRouter.post('/login', async (req, res) => {
  const { identifier, email, password } = req.body;
  try {
    const result = await authService.authenticateUser({
      emailOrIdentifier: email || identifier,
      password
    });
    res.json({ success: true, message: 'Login berhasil', ...result });
  } catch (error) {
    return replyAuthFailure(res, error);
  }
});

authRouter.post('/register', async (req, res) => {
  try {
    const { name, email, password, dob } = req.body;
    const result = await authService.registerUserInit({ name, email, password, dob });
    return res.status(202).json({
      success: true,
      message: 'Kode verifikasi telah dikirim ke email Anda dan berlaku 10 menit.',
      ...result
    });
  } catch (error) {
    return replyAuthFailure(res, error, { dbMessage: 'Gagal terhubung ke database.' });
  }
});

authRouter.post('/verify-registration', async (req, res) => {
  try {
    const { email, code } = req.body || {};
    const result = await authService.completeRegistration({ email, code });
    return res.status(201).json({
      success: true,
      message: 'Akun berhasil dibuat.',
      ...result
    });
  } catch (error) {
    return replyAuthFailure(res, error, { dbMessage: 'Gagal terhubung ke database.' });
  }
});

authRouter.post('/request-password-reset', wrap(async (req, res) => {
  const email = req.body?.email;
  const result = await authService.requestPasswordReset(email);
  return res.json(result);
}));

authRouter.post('/reset-password', wrap(async (req, res) => {
  const { email, code, password } = req.body || {};
  const result = await authService.executePasswordReset({
    email,
    code,
    newPassword: password
  });
  return res.json(result);
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
      message: `Tunggu ${cooldown} detik sebelum meminta kode baru.`,
      retryAfterSeconds: cooldown
    });
  }

  if (purpose === 'register') {
    const result = await authService.registerUserInit({
      name: existing.payload.name,
      email,
      password: 'dummy_not_used_for_hash',
      dob: existing.payload.dob
    });
    return res.json({
      success: true,
      message: 'Kode verifikasi baru telah dikirim.',
      devOtp: result.devOtp
    });
  }

  const result = await authService.requestPasswordReset(email);
  return res.json({
    success: true,
    message: 'Kode verifikasi baru telah dikirim.',
    devOtp: result.devOtp
  });
}));

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
