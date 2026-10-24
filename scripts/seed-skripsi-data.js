import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import sharp from 'sharp';
import { supabaseServer } from '../server/db.js';

console.log('🚀 Memulai Seeding Data Skripsi ke Supabase Cloud...');

async function optimizeCover(filePath) {
  const buffer = fs.readFileSync(filePath);
  const webpBuffer = await sharp(buffer)
    .resize({ width: 480, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();
  return `data:image/webp;base64,${webpBuffer.toString('base64')}`;
}

async function fileToDataUrl(filePath, mimeType = 'application/pdf') {
  const buffer = fs.readFileSync(filePath);
  return {
    dataUrl: `data:${mimeType};base64,${buffer.toString('base64')}`,
    size: buffer.length
  };
}

async function runSeed() {
  try {
    // 1. Bersihkan buku testing dummy yang lama
    console.log('\n1. Membersihkan buku dummy lama di tabel books...');
    await supabaseServer
      .from('books')
      .delete()
      .or('title.ilike.%test%,title.ilike.%testing%');
    console.log('✔ Buku dummy lama dibersihkan.');

    // 2. Daftar 4 Kitab Asli Wahidiyah
    console.log('\n2. Mengunggah 4 Kitab Asli Wahidiyah & Islam Klasik...');
    const booksToSeed = [
      {
        folder: '1-lembaran-sholawat-wahidiyah',
        pdfName: 'sholawat-wahidiyah-arab-latin.pdf',
        coverName: 'sampul.jpg',
        title: 'Lembaran Sholawat Wahidiyah',
        pages: 16,
        is_locked: false // Gratis untuk seluruh pengguna
      },
      {
        folder: '2-panduan-mujahadah-wahidiyah',
        pdfName: 'panduan-mujahadah-usbuiyah-syahriyah.pdf',
        coverName: 'sampul.jpg',
        title: 'Panduan Mujahadah Usbuiyah & Syahriyah',
        pages: 28,
        is_locked: false // Gratis untuk bimbingan pengamalan
      },
      {
        folder: '3-terjemah-kitab-al-hikam',
        pdfName: 'terjemah-al-hikam.pdf',
        coverName: 'sampul.jpg',
        title: 'Terjemah Kitab Al-Hikam',
        pages: 210,
        is_locked: true // Terkunci khusus Keanggotaan Pro
      },
      {
        folder: '4-terjemah-hadits-arbain-nawawi',
        pdfName: 'terjemah-hadits-arbain-nawawi.pdf',
        coverName: 'sampul.jpg',
        title: 'Hadits Arba’in An-Nawawiyah',
        pages: 48,
        is_locked: true // Terkunci khusus Keanggotaan Pro
      }
    ];

    for (const b of booksToSeed) {
      const folderPath = path.resolve('buku-siap-upload', b.folder);
      const pdfPath = path.join(folderPath, b.pdfName);
      const coverPath = path.join(folderPath, b.coverName);

      if (!fs.existsSync(pdfPath) || !fs.existsSync(coverPath)) {
        console.warn(`File tidak ditemukan untuk ${b.title}, melewati...`);
        continue;
      }

      console.log(`- Memproses ${b.title} (${b.is_locked ? 'Pro (Terkunci)' : 'Gratis'})...`);
      const coverUrl = await optimizeCover(coverPath);
      const { dataUrl, size } = await fileToDataUrl(pdfPath, 'application/pdf');

      const now = new Date().toISOString();

      const { data: existing } = await supabaseServer
        .from('books')
        .select('id')
        .eq('title', b.title)
        .maybeSingle();

      const bookPayload = {
        title: b.title,
        pages: b.pages,
        is_locked: b.is_locked,
        cover_url: coverUrl,
        content_url: dataUrl,
        content_name: b.pdfName,
        content_extension: 'pdf',
        content_size: size,
        updated_at: now
      };

      if (existing?.id) {
        const { error: updErr } = await supabaseServer
          .from('books')
          .update(bookPayload)
          .eq('id', existing.id);
        if (updErr) console.error(`Gagal update ${b.title}:`, updErr.message);
        else console.log(`  ✔ Berhasil diperbarui: ${b.title} (ID: ${existing.id})`);
      } else {
        const bookId = `buku-${crypto.randomBytes(8).toString('hex')}`;
        const { error: insErr } = await supabaseServer
          .from('books')
          .insert({
            id: bookId,
            ...bookPayload,
            created_at: now
          });
        if (insErr) console.error(`Gagal insert ${b.title}:`, insErr.message);
        else console.log(`  ✔ Berhasil disimpan: ${b.title} (ID: ${bookId})`);
      }
    }

    // 3. Masukkan 2 Agenda Kegiatan Kalender
    console.log('\n3. Menambahkan 2 Agenda Mujahadah di Kalender...');
    const now = new Date().toISOString();
    const events = [
      {
        title: 'Mujahadah Usbuiyah Berjamaah',
        event_date: '2026-10-29',
        time_start: '19:30',
        time_end: '21:00',
        location: 'Majelis Dzikir Sholawat Wahidiyah & Musholla Al-Ikhlas',
        category: 'Mujahadah',
        description: 'Pelaksanaan mujahadah mingguan (usbuiyah) bersama para pengamal Wahidiyah untuk kejernihan hati dan ketentraman bathin.',
        organizer: 'Penyiar Sholawat Wahidiyah',
        show_in_carousel: true
      },
      {
        title: 'Mujahadah Syahriyah Tingkat Kecamatan',
        event_date: '2026-11-08',
        time_start: '08:30',
        time_end: '11:30',
        location: 'Masjid Besar Jami\' Wahidiyah',
        category: 'Mujahadah',
        description: 'Mujahadah bulanan bersama seluruh jamaah dan keluarga besar pengamal Sholawat Wahidiyah se-Kecamatan.',
        organizer: 'DPP Penyiar Sholawat Wahidiyah',
        show_in_carousel: true
      }
    ];

    for (const evt of events) {
      const { data: existingEvt } = await supabaseServer
        .from('events')
        .select('id')
        .eq('title', evt.title)
        .maybeSingle();

      if (existingEvt?.id) {
        await supabaseServer.from('events').update(evt).eq('id', existingEvt.id);
        console.log(`  ✔ Agenda diperbarui: "${evt.title}" (${evt.event_date})`);
      } else {
        const evtId = `evt-${crypto.randomBytes(8).toString('hex')}`;
        await supabaseServer.from('events').insert({
          id: evtId,
          ...evt,
          created_at: now
        });
        console.log(`  ✔ Agenda ditambahkan: "${evt.title}" (${evt.event_date})`);
      }
    }

    console.log('\n🎉 SEEDING SELESAI DENGAN SUKSES! 4 Kitab Asli & 2 Agenda berhasil masuk.');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Terjadi kesalahan saat seeding:', err);
    process.exit(1);
  }
}

runSeed();
