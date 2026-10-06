
























import { OAuth2Client } from 'google-auth-library';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { exec } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 53682;
const REDIRECT_URI = `http://localhost:${PORT}/oauth2callback`;






const SCOPES = ['https://www.googleapis.com/auth/gmail.send'];

const env = {};
for (const line of fs.readFileSync(path.join(ROOT, '.env'), 'utf8').split(/\r?\n/)) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
}

const CLIENT_ID = env.GMAIL_CLIENT_ID || env.GOOGLE_CLIENT_ID || '';
const CLIENT_SECRET = env.GMAIL_CLIENT_SECRET || env.GOOGLE_CLIENT_SECRET || '';

console.log('');
console.log('=== Pengambil Gmail Refresh Token ===');
console.log('');

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('GAGAL: GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET tidak ditemukan di .env');
  process.exit(1);
}





console.log('┌──────────────────────────────────────────────────────────────────────┐');
console.log('│  SEBELUM LANJUT — pastikan dua hal ini sudah ada di Google Cloud:    │');
console.log('│                                                                      │');
console.log('│  1. Authorized redirect URI pada OAuth 2.0 Client ID Anda:           │');
console.log(`│     ${REDIRECT_URI.padEnd(63)}│`);
console.log('│                                                                      │');
console.log('│  2. Scope  gmail.send  ada di OAuth consent screen                   │');
console.log('│     (Data access), dan akun pengirim terdaftar sebagai Test user.    │');
console.log('└──────────────────────────────────────────────────────────────────────┘');
console.log('');
console.log('Client ID :', `${CLIENT_ID.slice(0, 24)}…`);
console.log('');

const client = new OAuth2Client({ clientId: CLIENT_ID, clientSecret: CLIENT_SECRET, redirectUri: REDIRECT_URI });

const authUrl = client.generateAuthUrl({
  access_type: 'offline',
  
  
  
  prompt: 'consent',
  scope: SCOPES
});

console.log('Membuka peramban… Kalau tidak terbuka otomatis, salin URL ini:');
console.log('');
console.log(authUrl);
console.log('');

if (process.platform === 'win32') {
  exec(`start "" "${authUrl}"`, () => {});
} else if (process.platform === 'darwin') {
  exec(`open "${authUrl}"`, () => {});
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  if (url.pathname !== '/oauth2callback') {
    res.writeHead(404).end('not found');
    return;
  }

  const error = url.searchParams.get('error');
  const code = url.searchParams.get('code');

  if (error) {
    res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`<h2>Gagal</h2><p>${error}</p><p>Tutup tab ini dan lihat terminal.</p>`);
    console.error('');
    console.error('Google menolak:', error);
    if (error === 'access_denied') {
      console.error('Anda menolak izin, atau akun ini belum terdaftar sebagai Test user.');
    }
    server.close();
    process.exit(1);
  }

  if (!code) {
    res.writeHead(400).end('kode tidak ditemukan');
    return;
  }

  try {
    const { tokens } = await client.getToken(code);
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end('<h2>Berhasil</h2><p>Token sudah didapat. Tutup tab ini dan kembali ke terminal.</p>');

    console.log('');
    console.log('════════════════════════════════════════════════════════════');
    if (!tokens.refresh_token) {
      console.log('PERHATIAN: Google tidak mengirim refresh_token.');
      console.log('Biasanya karena aplikasi ini sudah pernah Anda izinkan.');
      console.log('Buka https://myaccount.google.com/permissions, hapus akses');
      console.log('untuk aplikasi ini, lalu jalankan skrip ini lagi.');
      console.log('════════════════════════════════════════════════════════════');
      server.close();
      process.exit(1);
    }

    console.log('BERHASIL. Tempel baris berikut ke .env (bagian #6):');
    console.log('════════════════════════════════════════════════════════════');
    console.log('');

    
    
    
    
    let senderEmail = '';
    try {
      if (tokens.access_token) {
        const profileRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
          headers: { Authorization: `Bearer ${tokens.access_token}` }
        });
        if (profileRes.ok) {
          const profile = await profileRes.json();
          senderEmail = profile.emailAddress || '';
        } else if (profileRes.status === 403) {
          console.warn('(Catatan: scope gmail.send tidak mengizinkan baca profil — isi GMAIL_SENDER manual.)');
        } else {
          console.warn('(Catatan: tidak bisa membaca profil Gmail — HTTP ' + profileRes.status + ')');
        }
      }
    } catch (profileError) {
      console.warn('(Catatan: gagal membaca profil Gmail — ' + profileError.message + ')');
    }

    console.log('GMAIL_SENDER=' + (senderEmail || '<isi alamat gmail Anda>'));
    console.log('GMAIL_REFRESH_TOKEN=' + tokens.refresh_token);
    console.log('GMAIL_SENDER_NAME=Buku Wahidiyah');
    console.log('');
    console.log('════════════════════════════════════════════════════════════');
    console.log('Lalu restart server. GMAIL_CLIENT_ID dan GMAIL_CLIENT_SECRET');
    console.log('tidak perlu ditulis ulang — kode memakai GOOGLE_CLIENT_ID dan');
    console.log('GOOGLE_CLIENT_SECRET yang sudah ada di .env.');
    console.log('════════════════════════════════════════════════════════════');
    console.log('');
    server.close();
    process.exit(0);
  } catch (err) {
    res.writeHead(500).end('gagal menukar kode');
    console.error('');
    console.error('Gagal menukar kode dengan token:', err.message);
    server.close();
    process.exit(1);
  }
});

server.listen(PORT, () => {
  console.log(`Menunggu Anda menyelesaikan izin di peramban (port ${PORT})…`);
  console.log('Tekan Ctrl+C untuk membatalkan.');
  console.log('');

  
  
  
  setTimeout(() => {
    console.log('');
    console.log('════════════════════════════════════════════════════════════');
    console.log('BERHENTI: 5 menit berlalu tanpa callback dari Google.');
    console.log('');
    console.log('Penyebab paling sering — Google TIDAK mengarahkan balik ke sini:');
    console.log(`  • Redirect URI belum terdaftar: ${REDIRECT_URI}`);
    console.log('    → Google Cloud → APIs & Services → Credentials →');
    console.log('      OAuth 2.0 Client ID Anda → Authorized redirect URIs → tambahkan.');
    console.log('  • Halaman peramban menampilkan "redirect_uri_mismatch" atau');
    console.log('    "access_denied" — itu pesan dari Google, bukan dari skrip ini.');
    console.log('  • Jendela izin belum diselesaikan / ditutup sebelum selesai.');
    console.log('');
    console.log('Jalankan ulang skrip ini setelah diperbaiki.');
    console.log('════════════════════════════════════════════════════════════');
    server.close();
    process.exit(1);
  }, 5 * 60 * 1000).unref();
});
