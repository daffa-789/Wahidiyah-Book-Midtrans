
import { describe, expect, it } from 'vitest';

/* Kunci server di-set SEBELUM impor dinamis karena config.js membaca
 * environment saat modul dimuat; verifySignatureKey butuh kunci nyata. */
process.env.MIDTRANS_SERVER_KEY = 'SB-TEST-SERVER-KEY';
process.env.MIDTRANS_CLIENT_KEY = 'SB-TEST-CLIENT-KEY';

const {
  extractQrAction,
  extractQrString,
  isAllowedQrUrl,
  isTransactionSettled,
  isVoidAcknowledged,
  verifySignatureKey
} = await import('../server/lib/midtrans.js');

import crypto from 'crypto';

const signatureFor = (orderId, statusCode, grossAmount, serverKey = 'SB-TEST-SERVER-KEY') =>
  crypto.createHash('sha512')
    .update(`${orderId}${statusCode}${grossAmount}${serverKey}`)
    .digest('hex');


describe('midtrans: ekstraksi payload QRIS charge', () => {
  it('membaca qr_string dari payload langsung (bentuk SDK)', () => {
    expect(extractQrString({ qr_string: '  EMVCO-PAYLOAD  ' })).toBe('EMVCO-PAYLOAD');
  });

  it('membaca qr_string dari payload terbungkus { data } (bentuk REST mentah)', () => {
    expect(extractQrString({ data: { qr_string: 'EMVCO-2' } })).toBe('EMVCO-2');
  });

  it('mengembalikan null bila qr_string tidak ada atau kosong', () => {
    expect(extractQrString({})).toBeNull();
    expect(extractQrString({ qr_string: '   ' })).toBeNull();
    expect(extractQrString(null)).toBeNull();
  });

  it('memilih action generate-qr-code-v2 sebagai cadangan gambar QR', () => {
    const charge = {
      actions: [
        { name: 'generate-qr-code', url: 'https://api.midtrans.com/v1/qr/old' },
        { name: 'generate-qr-code-v2', url: 'https://api.midtrans.com/v2/qr/new' }
      ]
    };
    expect(extractQrAction(charge)?.url).toBe('https://api.midtrans.com/v2/qr/new');
  });

  it('jatuh ke generate-qr-code bila v2 tidak ada, dan null bila tak ada action', () => {
    expect(extractQrAction({ actions: [{ name: 'generate-qr-code', url: 'https://api.midtrans.com/x' }] })?.name)
      .toBe('generate-qr-code');
    expect(extractQrAction({ actions: [] })).toBeNull();
  });
});


describe('midtrans: isTransactionSettled (status lunas)', () => {
  it.each([
    ['settlement', '', true],
    ['settlement', 'accept', true],
    ['settlement', 'challenge', false],
    ['capture', 'accept', true],
    ['capture', '', false],
    ['pending', 'accept', false],
    ['deny', '', false],
    [null, null, false]
  ])('status %s + fraud %s → %s', (status, fraud, expected) => {
    expect(isTransactionSettled(status, fraud)).toBe(expected);
  });
});


describe('midtrans: isVoidAcknowledged (kode balasan pembatalan)', () => {
  it.each([
    [{ status_code: '200' }, true],
    [{ status_code: '201' }, true],
    [{ status_code: '407', status_message: 'Success, transaction is expired' }, true],
    [{ status_code: '407', status_message: 'Transaction is not expired yet' }, false],
    [{ status_code: '404', status_message: "Transaction doesn't exist" }, true],
    [{ status_code: '404', status_message: 'not found' }, true],
    [{ status_code: '412', status_message: 'Transaction status cannot be updated' }, false],
    [{}, false]
  ])('payload %j → %s', (payload, expected) => {
    expect(isVoidAcknowledged(payload)).toBe(expected);
  });
});


describe('midtrans: verifySignatureKey (sha512)', () => {
  it('menerima signature yang dihitung dengan formula resmi Midtrans', () => {
    const payload = {
      order_id: 'tx-abc123',
      status_code: '200',
      gross_amount: '28000.00',
      signature_key: signatureFor('tx-abc123', '200', '28000.00')
    };
    expect(verifySignatureKey(payload)).toEqual({ ok: true });
  });

  it('menolak signature yang dimanipulasi (panjang sama, isi beda)', () => {
    const payload = {
      order_id: 'tx-abc123',
      status_code: '200',
      gross_amount: '28000.00',
      signature_key: signatureFor('tx-abc123', '200', '28000.00', 'KUNCI-LAIN')
    };
    expect(verifySignatureKey(payload).ok).toBe(false);
  });

  it('menolak payload tanpa signature_key (panjang nol ≠ hash 128 karakter)', () => {
    expect(verifySignatureKey({ order_id: 'tx-1', status_code: '200', gross_amount: '1000' }).ok).toBe(false);
  });
});


describe('midtrans: isAllowedQrUrl (allowlist domain gambar QR)', () => {
  it('menerima https midtrans.com dan subdomainnya', () => {
    expect(isAllowedQrUrl('https://api.midtrans.com/v2/qr/1')).toBe(true);
    expect(isAllowedQrUrl('https://midtrans.com/qr.png')).toBe(true);
  });

  it('menolak protokol non-https, domain lain, dan URL rusak', () => {
    expect(isAllowedQrUrl('http://api.midtrans.com/v2/qr/1')).toBe(false);
    expect(isAllowedQrUrl('https://evil.example/qr.png')).toBe(false);
    expect(isAllowedQrUrl('bukan-url')).toBe(false);
    expect(isAllowedQrUrl(null)).toBe(false);
  });
});
