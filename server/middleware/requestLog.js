

import crypto from 'crypto';
import { logger } from '../logger.js';

const isNoise = (url) =>
  url.startsWith('/assets/') ||
  url.startsWith('/@vite') ||
  url.startsWith('/@fs') ||
  url.startsWith('/node_modules/') ||
  url.includes('/__vite_ping');

export function requestContext(req, res, next) {
  req.id = crypto.randomUUID();
  res.setHeader('X-Request-Id', req.id);

  if (isNoise(req.originalUrl || req.url || '')) return next();

  const startedAt = process.hrtime.bigint();
  res.on('finish', () => {
    const durationMs = Math.round(Number(process.hrtime.bigint() - startedAt) / 1e6);
    logger.request({
      method: req.method,
      path: req.originalUrl || req.url,
      status: res.statusCode,
      durationMs,
      ip: req.ip
    });
  });

  return next();
}
