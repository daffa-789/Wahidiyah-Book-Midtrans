

import { CONTENT_MIME_BY_EXTENSION, RAW_IMAGE_FALLBACK_MIMES } from './constants.js';


export const DB_DOWN_MESSAGE =
  'Layanan database Cloud sedang sibuk atau tidak terjangkau. Silakan periksa koneksi internet Anda.';


export const isDbDown = (error) =>
  error?.code === 'ECONNREFUSED' || Boolean(error?.message?.includes('ECONNREFUSED'));


const includeErrorDetail = process.env.NODE_ENV === 'development';


export const fail = (res, error) => {
  if (isDbDown(error)) {
    return res.status(503).json({
      success: false,
      message: DB_DOWN_MESSAGE,
      error: includeErrorDetail ? error.message : undefined,
      isDatabaseError: true
    });
  }
  return res.status(500).json({
    success: false,
    error: includeErrorDetail ? error.message : undefined
  });
};


export const internalErrorDetail = (error, exposeDetail = includeErrorDetail) =>
  exposeDetail ? error?.message : undefined;


export const authFailureMessage = (error, exposeDetail = includeErrorDetail) =>
  exposeDetail ? (error?.message || 'Terjadi kesalahan pada server') : 'Terjadi kesalahan pada server';


export const wrap = (handler) => async (req, res, next) => {
  try {
    await handler(req, res, next);
  } catch (error) {
    fail(res, error);
  }
};


export const safeContentMime = (book) =>
  CONTENT_MIME_BY_EXTENSION[String(book?.content_extension || '').replace('.', '').toLowerCase()] ||
  'application/octet-stream';


export const isSafeRawImageFallback = (mime) =>
  RAW_IMAGE_FALLBACK_MIMES.has(String(mime || '').toLowerCase());

const DATA_URL_PATTERN = /^data:([^;]+);base64,(.+)$/;


export const sendDataUrl = (res, url, { fallbackMime, cacheControl }) => {
  if (!url || !url.startsWith('data:')) return false;
  const matches = url.match(DATA_URL_PATTERN);
  if (!matches) return false;

  if (cacheControl) res.setHeader('Cache-Control', cacheControl);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.type(matches[1] || fallbackMime || 'application/octet-stream');
  res.send(Buffer.from(matches[2], 'base64'));
  return true;
};
