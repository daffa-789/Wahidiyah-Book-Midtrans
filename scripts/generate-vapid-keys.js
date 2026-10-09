/* Membuat pasangan kunci VAPID untuk Web Push.
 *
 * Jalankan SEKALI:  node scripts/generate-vapid-keys.js
 *
 * Kunci publik boleh dibagikan ke peramban (memang harus). Kunci privat
 * RAHASIA — perlakukan seperti MIDTRANS_SERVER_KEY. Kalau kunci diganti,
 * seluruh langganan lama otomatis tidak berlaku (peramban menolak tanda
 * tangan baru) sehingga setiap pengguna perlu mengaktifkan notifikasi lagi.
 */

import { generateVapidKeys } from '../server/lib/webpush.js';

const { publicKey, privateKey } = generateVapidKeys();

const line = '─'.repeat(66);

console.log('');
console.log(`  ${line}`);
console.log('  Pasangan kunci VAPID — salin ke .env');
console.log(`  ${line}`);
console.log('');
console.log(`  VAPID_PUBLIC_KEY=${publicKey}`);
console.log('');
console.log(`  VAPID_PRIVATE_KEY=${privateKey}`);
console.log('');
console.log(`  VAPID_SUBJECT=mailto:admin@example.com`);
console.log('');
console.log(`  ${line}`);
console.log('  Langkah berikutnya:');
console.log('    1. Tempel ketiga baris di atas ke .env');
console.log('    2. Isi VAPID_SUBJECT dengan email kontak Anda (wajib berawalan mailto:');
console.log('       atau berupa URL https://) — dipakai push service untuk menghubungi');
console.log('       Anda bila ada masalah pengiriman.');
console.log('    3. Restart server, lalu jalankan blok PATCH Web Push pada');
console.log('       supabase_database/full_setup.sql di SQL Editor Supabase.');
console.log(`  ${line}`);
console.log('  PERINGATAN: jangan pernah commit .env. Kunci privat di atas setara');
console.log('  dengan kata sandi pengirim notifikasi aplikasi Anda.');
console.log('');
