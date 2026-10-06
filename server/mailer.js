





















import { OAuth2Client } from 'google-auth-library';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });
dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config();

const CLIENT_ID = process.env.GMAIL_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || '';
const CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET || '';
const REFRESH_TOKEN = process.env.GMAIL_REFRESH_TOKEN || '';
const SENDER = process.env.GMAIL_SENDER || '';
const SENDER_NAME = process.env.GMAIL_SENDER_NAME || 'Buku Wahidiyah';

const GMAIL_SEND_URL = 'https://gmail.googleapis.com/gmail/v1/users/me/messages/send';

export const isMailerConfigured = () =>
  Boolean(CLIENT_ID && CLIENT_SECRET && REFRESH_TOKEN && SENDER);

const oauthClient = isMailerConfigured()
  ? new OAuth2Client({ clientId: CLIENT_ID, clientSecret: CLIENT_SECRET })
  : null;
if (oauthClient) oauthClient.setCredentials({ refresh_token: REFRESH_TOKEN });








const encodeHeader = (value) => `=?UTF-8?B?${Buffer.from(String(value), 'utf8').toString('base64')}?=`;
const encodeBody = (value) => Buffer.from(String(value), 'utf8').toString('base64');


const wrap76 = (base64) => (base64.match(/.{1,76}/g) || []).join('\r\n');


const rfc2822Date = (d = new Date()) => {
  const pad = (n) => String(n).padStart(2, '0');
  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const offsetMinutes = -d.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const abs = Math.abs(offsetMinutes);
  return (
    `${DAYS[d.getDay()]}, ${pad(d.getDate())} ${MONTHS[d.getMonth()]} ${d.getFullYear()} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())} ` +
    `${sign}${pad(Math.floor(abs / 60))}${pad(abs % 60)}`
  );
};


export const buildMimeMessage = ({ to, subject, text, html }) => {
  const boundary = `bw_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
  const from = SENDER_NAME ? `${SENDER_NAME} <${SENDER}>` : SENDER;
  
  
  const domain = SENDER.includes('@') ? SENDER.split('@').pop() : 'localhost';
  
  
  const messageId = `<${Date.now().toString(36)}.${Math.random().toString(36).slice(2, 12)}@${domain}>`;

  return [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${encodeHeader(subject)}`,
    `Date: ${rfc2822Date()}`,
    `Message-ID: ${messageId}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: base64',
    '',
    wrap76(encodeBody(text)),
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    'Content-Transfer-Encoding: base64',
    '',
    wrap76(encodeBody(html)),
    `--${boundary}--`,
    ''
  ].join('\r\n');
};

const sendViaGmailApi = async ({ to, subject, text, html }) => {
  if (!oauthClient) return false;

  const { token } = await oauthClient.getAccessToken();
  if (!token) throw new Error('Gagal memperoleh access token Gmail (refresh token mungkin sudah dicabut).');

  const raw = Buffer.from(buildMimeMessage({ to, subject, text, html }), 'utf8').toString('base64url');

  const response = await fetch(GMAIL_SEND_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ raw })
  });

  if (!response.ok) {
    const detail = (await response.text()).slice(0, 300);
    throw new Error(`Gmail API membalas HTTP ${response.status}: ${detail}`);
  }
  return true;
};


const COPY = {
  register: {
    subject: 'Kode Verifikasi Pendaftaran — Buku Wahidiyah',
    lead: 'Kode verifikasi untuk menyelesaikan pendaftaran akun',
    closing: 'Masukkan kode ini di halaman verifikasi untuk mengaktifkan akun Anda.'
  },
  reset: {
    subject: 'Kode Pemulihan Password — Buku Wahidiyah',
    lead: 'Kode untuk mengatur ulang password akun',
    closing: 'Jika Anda tidak meminta pengaturan ulang password, abaikan email ini — password Anda tidak berubah.'
  }
};


export const sendOtpEmail = async (email, code, purpose = 'register') => {
  if (!oauthClient) return false;
  const copy = COPY[purpose] || COPY.register;

  return sendViaGmailApi({
    to: email,
    subject: copy.subject,
    text: `${copy.lead}: ${code}\n\nKode berlaku 10 menit dan hanya dapat dipakai sekali.\n${copy.closing}`,
    html: `<p>${copy.lead} <strong>${email}</strong>:</p>
<p style="font-size:30px;font-weight:800;letter-spacing:7px;margin:14px 0">${code}</p>
<p>Kode berlaku <strong>10 menit</strong> dan hanya dapat dipakai sekali.</p>
<p style="color:#5A544C;font-size:13px">${copy.closing}</p>`
  });
};






export const sendGoogleAccountEmail = async (email) => {
  if (!oauthClient) return false;
  return sendViaGmailApi({
    to: email,
    subject: 'Cara masuk akun Buku Wahidiyah Anda',
    text: `Akun ${email} terdaftar melalui Google, sehingga tidak memiliki password yang bisa diatur ulang.\n\nSilakan masuk dengan tombol "Login dengan Google" di halaman masuk.`,
    html: `<p>Akun <strong>${email}</strong> terdaftar melalui <strong>Google</strong>, sehingga tidak memiliki password yang bisa diatur ulang.</p>
<p>Silakan masuk dengan tombol <strong>"Login dengan Google"</strong> di halaman masuk.</p>`
  });
};
