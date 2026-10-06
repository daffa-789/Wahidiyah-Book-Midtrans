

import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import express from 'express';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import {
  ALLOWED_ORIGINS,
  AUTH_RATE_LIMIT,
  AUTH_RATE_LIMITED_PATHS,
  USE_VITE_MIDDLEWARE
} from '../config.js';

export const securityHeaders = helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' }
});

export const corsPolicy = cors({
  origin(origin, callback) {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    return callback(null, false);
  }
});

export const responseCompression = compression({ threshold: 1024 });

export const jsonBody = express.json({ limit: '1mb' });

export const trustProxy = (app) => {
  app.set('trust proxy', USE_VITE_MIDDLEWARE ? 1 : false);
};

export const authRateLimiter = rateLimit({
  windowMs: AUTH_RATE_LIMIT.windowMs,
  max: AUTH_RATE_LIMIT.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: AUTH_RATE_LIMIT.message,

  keyGenerator: (req) => ipKeyGenerator(req.socket?.remoteAddress || req.ip || 'unknown')
});

export const authRateLimitedPaths = AUTH_RATE_LIMITED_PATHS;
