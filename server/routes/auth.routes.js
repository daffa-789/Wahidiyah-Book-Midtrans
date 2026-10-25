
/**
 * Route Layer — Modul Otentikasi (Fase 3 roadmap arsitektur).
 *
 * Berkas ini sengaja tipis: hanya pemetaan URL → middleware → method
 * controller. Rate limiting auth tidak didefinisikan di sini — dipasang
 * global di `server.js` melalui `AUTH_RATE_LIMITED_PATHS` (config.js).
 * Seluruh logika bisnis ada di `server/services/auth.service.js`;
 * pemformatan HTTP ada di `server/controllers/auth.controller.js`.
 */

import { Router } from 'express';
import { requireAuth } from '../auth.js';
import { wrap } from '../lib/http.js';
import {
  exchange,
  googleCallback,
  googleSupabase,
  login,
  me,
  register,
  requestPasswordReset,
  resendVerification,
  resetPassword,
  verifyRegistration
} from '../controllers/auth.controller.js';

export const authRouter = Router();

authRouter.post('/login', wrap(login));

authRouter.post('/register', wrap(register));

authRouter.post('/verify-registration', wrap(verifyRegistration));

authRouter.post('/request-password-reset', wrap(requestPasswordReset));

authRouter.post('/reset-password', wrap(resetPassword));

authRouter.post('/resend-verification', wrap(resendVerification));

authRouter.post('/google-supabase', wrap(googleSupabase));

authRouter.get('/google/callback', wrap(googleCallback));

authRouter.post('/exchange', wrap(exchange));

authRouter.get('/me', requireAuth, wrap(me));
