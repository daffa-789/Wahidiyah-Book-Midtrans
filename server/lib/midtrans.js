
import crypto from 'crypto';
import midtransClient from 'midtrans-client';
import {
  MIDTRANS_CLIENT_KEY,
  MIDTRANS_IS_PRODUCTION,
  MIDTRANS_QRIS_ACQUIRER,
  MIDTRANS_QRIS_EXPIRY_MINUTES,
  MIDTRANS_SERVER_KEY
} from '../config.js';



export const DEFAULT_QRIS_EXPIRY_MINUTES = 15;

export const isMidtransConfigured = Boolean(MIDTRANS_SERVER_KEY && MIDTRANS_CLIENT_KEY);

let coreApi = null;


function getCoreApi() {
  if (!isMidtransConfigured) {
    const error = new Error(
      'Midtrans belum dikonfigurasi. Isi MIDTRANS_SERVER_KEY dan MIDTRANS_CLIENT_KEY di .env '
      + '(kunci sandbox: SB-Mid-server-… / SB-Mid-client-… dari dashboard.sandbox.midtrans.com).'
    );
    error.code = 'MIDTRANS_NOT_CONFIGURED';
    throw error;
  }

  if (!coreApi) {
    coreApi = new midtransClient.CoreApi({
      isProduction: MIDTRANS_IS_PRODUCTION,
      serverKey: MIDTRANS_SERVER_KEY,
      clientKey: MIDTRANS_CLIENT_KEY
    });
  }

  return coreApi;
}


export const resetCoreApi = () => {
  coreApi = null;
};


const pad = (value) => String(value).padStart(2, '0');


const jakartaOrderTime = () => {
  const shifted = new Date(Date.now() + 7 * 60 * 60 * 1000);
  return `${shifted.getUTCFullYear()}-${pad(shifted.getUTCMonth() + 1)}-${pad(shifted.getUTCDate())} `
    + `${pad(shifted.getUTCHours())}:${pad(shifted.getUTCMinutes())}:${pad(shifted.getUTCSeconds())} +0700`;
};


export const pickQrAction = (actions) => {
  const list = Array.isArray(actions) ? actions : [];
  const preferred = list.find((item) => item?.name === 'generate-qr-code-v2' && item?.url);
  if (preferred) return preferred;
  return list.find((item) => item?.name === 'generate-qr-code' && item?.url) || null;
};


export async function createQrisCharge({
  orderId,
  grossAmount,
  itemDetails = [],
  customerDetails = {}
}) {
  const api = getCoreApi();

  const parameter = {
    payment_type: 'qris',
    transaction_details: {
      order_id: orderId,
      gross_amount: Math.round(Number(grossAmount))
    },
    item_details: itemDetails,
    customer_details: customerDetails,
    qris: {
      acquirer: MIDTRANS_QRIS_ACQUIRER || 'gopay'
    }
  };

  
  
  if (MIDTRANS_QRIS_EXPIRY_MINUTES !== DEFAULT_QRIS_EXPIRY_MINUTES) {
    parameter.custom_expiry = {
      order_time: jakartaOrderTime(),
      expiry_duration: MIDTRANS_QRIS_EXPIRY_MINUTES,
      unit: 'minute'
    };
  }

  return api.charge(parameter);
}


export async function getTransactionStatus(orderId) {
  const api = getCoreApi();
  return api.transaction.status(orderId);
}


export function verifySignatureKey(payload = {}) {
  if (!MIDTRANS_SERVER_KEY) {
    return { ok: false, reason: 'MIDTRANS_SERVER_KEY belum diisi.' };
  }

  const raw = `${payload.order_id ?? ''}${payload.status_code ?? ''}${payload.gross_amount ?? ''}${MIDTRANS_SERVER_KEY}`;
  const expected = crypto.createHash('sha512').update(raw).digest('hex');
  const provided = Buffer.from(String(payload.signature_key ?? ''));
  const expectedBuffer = Buffer.from(expected);

  if (provided.length !== expectedBuffer.length) {
    return { ok: false, reason: 'Signature key tidak valid.' };
  }

  return crypto.timingSafeEqual(provided, expectedBuffer)
    ? { ok: true }
    : { ok: false, reason: 'Signature key tidak valid.' };
}


export const QR_IMAGE_TIMEOUT_MS = 10_000;


export const isAllowedQrUrl = (rawUrl) => {
  try {
    const parsed = new URL(String(rawUrl));
    if (parsed.protocol !== 'https:') return false;
    const host = parsed.hostname.toLowerCase();
    return host === 'midtrans.com' || host.endsWith('.midtrans.com');
  } catch {
    return false;
  }
};


export async function fetchQrImage(qrUrl) {
  if (!isAllowedQrUrl(qrUrl)) {
    const error = new Error('URL gambar QR tidak diizinkan.');
    error.code = 'QR_URL_NOT_ALLOWED';
    throw error;
  }

  const auth = Buffer.from(`${MIDTRANS_SERVER_KEY}:`).toString('base64');
  const response = await fetch(qrUrl, {
    headers: {
      Authorization: `Basic ${auth}`,
      Accept: 'image/png'
    },
    redirect: 'manual',
    signal: AbortSignal.timeout(QR_IMAGE_TIMEOUT_MS)
  });

  if (response.status >= 300 && response.status < 400) {
    const error = new Error('Midtrans mengembalikan pengalihan saat mengambil gambar QR.');
    error.status = response.status;
    throw error;
  }

  if (!response.ok) {
    const error = new Error(`Gagal mengambil gambar QR dari Midtrans (HTTP ${response.status}).`);
    error.status = response.status;
    throw error;
  }

  return Buffer.from(await response.arrayBuffer());
}
