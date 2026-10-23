import sharp from 'sharp';
import { supabaseServer } from '../server/db.js';
import { generateId } from '../server/auth.js';

// Helper escape XML untuk teks dalam SVG
function escapeXml(unsafe) {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// SVG generator untuk thumbnail sampul buku beresolusi tinggi dengan tema islami dan 3 Color Key
function createCoverSvg({ title, subtitle, author, category, isLocked, bg1, bg2, accentColor }) {
  const safeTitle = escapeXml(title);
  const safeSubtitle = escapeXml(subtitle);
  const safeAuthor = escapeXml(author);
  const safeCategory = escapeXml(category.toUpperCase());

  return `
<svg width="600" height="840" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${bg1}" />
      <stop offset="100%" stop-color="${bg2}" />
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#D97706" />
      <stop offset="50%" stop-color="#FBBF24" />
      <stop offset="100%" stop-color="#B45309" />
    </linearGradient>
  </defs>

  <!-- Latar Belakang -->
  <rect width="600" height="840" fill="url(#bgGrad)" />

  <!-- Bingkai Ornamen Luar -->
  <rect x="25" y="25" width="550" height="790" fill="none" stroke="${accentColor}" stroke-width="2.5" rx="16" />
  <rect x="35" y="35" width="530" height="770" fill="none" stroke="${accentColor}" stroke-width="1" stroke-dasharray="8,5" opacity="0.6" rx="12" />

  <!-- Aksen Sudut Tradisional -->
  <g stroke="${accentColor}" stroke-width="2" fill="none">
    <path d="M 45 65 L 45 45 L 65 45" />
    <path d="M 555 65 L 555 45 L 535 45" />
    <path d="M 45 775 L 45 795 L 65 795" />
    <path d="M 555 775 L 555 795 L 535 795" />
  </g>

  <!-- Efek Punggung Buku -->
  <rect x="0" y="0" width="30" height="840" fill="black" opacity="0.25" />
  <line x1="30" y1="0" x2="30" y2="840" stroke="rgba(255,255,255,0.15)" stroke-width="2" />

  <!-- Badge Kategori -->
  <g transform="translate(300, 110)">
    <rect x="-85" y="-18" width="170" height="36" rx="18" fill="rgba(255,255,255,0.15)" stroke="${accentColor}" stroke-width="1.5" />
    <text x="0" y="5" font-family="sans-serif" font-size="14" font-weight="bold" fill="#FDFBF7" text-anchor="middle" letter-spacing="2">
      ${safeCategory}
    </text>
  </g>

  <!-- Simbol Ornamen / Bintang Segi Delapan -->
  <g transform="translate(300, 240)">
    <circle r="42" fill="none" stroke="${accentColor}" stroke-width="2" opacity="0.8" />
    <circle r="36" fill="rgba(255,255,255,0.05)" />
    <polygon points="0,-32 9,-9 32,0 9,9 0,32 -9,9 -32,0 -9,-9" fill="${accentColor}" opacity="0.9" />
  </g>

  <!-- Judul Utama Buku -->
  <text x="300" y="380" font-family="serif, 'Times New Roman'" font-size="34" font-weight="bold" fill="#FFFDF8" text-anchor="middle">
    ${safeTitle.length > 25 ? safeTitle.slice(0, 25) : safeTitle}
  </text>
  ${safeTitle.length > 25 ? `
  <text x="300" y="425" font-family="serif, 'Times New Roman'" font-size="32" font-weight="bold" fill="#FFFDF8" text-anchor="middle">
    ${safeTitle.slice(25)}
  </text>` : ''}

  <!-- Garis Pemisah Emas -->
  <line x1="180" y1="465" x2="420" y2="465" stroke="url(#goldGrad)" stroke-width="3" stroke-linecap="round" />

  <!-- Subtitle -->
  <text x="300" y="505" font-family="sans-serif" font-size="16" fill="#F3EAD8" text-anchor="middle" opacity="0.9">
    ${safeSubtitle}
  </text>

  <!-- Penulis -->
  <g transform="translate(300, 680)">
    <text x="0" y="0" font-family="sans-serif" font-size="13" fill="#D5CCB9" text-anchor="middle" letter-spacing="1">
      PENYUSUN &amp; PENERBIT
    </text>
    <text x="0" y="26" font-family="serif" font-size="18" font-weight="bold" fill="#FFFDF8" text-anchor="middle">
      ${safeAuthor}
    </text>
  </g>

  <!-- Status Akses: Gratis / PRO -->
  <g transform="translate(300, 770)">
    <rect x="-60" y="-14" width="120" height="28" rx="14" fill="${isLocked ? '#B45309' : '#14523A'}" stroke="#FFFDF8" stroke-width="1.5" />
    <text x="0" y="4" font-family="sans-serif" font-size="12" font-weight="bold" fill="#FFFDF8" text-anchor="middle" letter-spacing="1.5">
      ${isLocked ? 'PRO ACCESS' : 'GRATIS'}
    </text>
  </g>
</svg>
`;
}

// Unduh sampel PDF publik dari GitHub / W3C sebagai isi dokumen nyata
async function downloadSamplePdf() {
  const url = 'https://raw.githubusercontent.com/mozilla/pdf.js/master/examples/learning/helloworld.pdf';
  console.log(`Mengunduh sampel PDF dari ${url}...`);
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Gagal mengunduh PDF: ${response.statusText}`);
  return Buffer.from(await response.arrayBuffer());
}

const BOOKS_DATA = [
  {
    title: 'Lembaran Sholawat Wahidiyah',
    subtitle: 'Bacaan Resmi, Kaifiyah Mujahadah & Terjemah',
    author: 'K.H. Moh. Ma’roef RA',
    category: 'Amalan',
    pages: 16,
    is_locked: false,
    description: 'Naskah resmi bacaan Sholawat Wahidiyah lengkap dengan Surat Al-Fatihah Khusus, Sholawat Ma’rifat, doa penutup, serta bimbingan adab lahiriyah dan batiniyah dalam mengamalkannya.',
    bg1: '#14523A',
    bg2: '#08251A',
    accentColor: '#F59E0B'
  },
  {
    title: 'Bimbingan Praktis Mujahadah 40 Hari',
    subtitle: 'Panduan Mujahadah Mandiri & Berjamaah',
    author: 'DPP Penyiar Sholawat Wahidiyah',
    category: 'Bimbingan',
    pages: 28,
    is_locked: false,
    description: 'Panduan tata cara mengamalkan Sholawat Wahidiyah selama 40 hari berturut-turut, adab bermujahadah, mujahadah keluarga, serta tata cara sowan dan penyiarannya.',
    bg1: '#1E3A8A',
    bg2: '#0F172A',
    accentColor: '#38BDF8'
  },
  {
    title: 'Kuliah Ajaran Wahidiyah: Lillah Billah',
    subtitle: 'Pondasi Ketauhidan Menuju Ma’rifatullah',
    author: 'K.H. Ihsan Mahdum',
    category: 'Tasawuf',
    pages: 45,
    is_locked: false,
    description: 'Kajian komprehensif ajaran dasar Wahidiyah: Lillah-Billah, Lirrosul-Birrosul, dan Lilghouts-Bilghouts untuk menata hati, melatih keikhlasan, dan mendekatkan diri kepada Allah SWT.',
    bg1: '#78350F',
    bg2: '#291405',
    accentColor: '#FCD34D'
  },
  {
    title: 'Syarah Al-Hikam: Mutiara Tasawuf',
    subtitle: 'Untaian Hikmah Pembersih Hati & Jiwa',
    author: 'Syaikh Ibnu Atha’illah as-Sakandari',
    category: 'Kitab Kuning',
    pages: 120,
    is_locked: true,
    description: 'Kitab kuning rujukan tasawuf klasik mengenai pelepasan ketergantungan amal duniawi, tingkatan tawakal, dan rahasia hubungan hamba dengan Sang Pencipta. Koleksi khusus anggota Pro.',
    bg1: '#831843',
    bg2: '#3B0718',
    accentColor: '#F472B6'
  },
  {
    title: 'Kumpulan Doa & Mujahadah Kubro',
    subtitle: 'Wirid Khusus dan Panduan Mujahadah Nasional',
    author: 'Yayasan Perjuangan Wahidiyah',
    category: 'Doa & Zikir',
    pages: 34,
    is_locked: true,
    description: 'Susunan doa resmi dan panduan istighosah Mujahadah Kubro yang diselenggarakan dua kali setahun di Pesantren Kedunglo Kediri. Eksklusif untuk pembaca Pro.',
    bg1: '#134E4A',
    bg2: '#042F2E',
    accentColor: '#2DD4BF'
  }
];

async function main() {
  console.log('Mempersiapkan seeding buku ke basis data...');
  const samplePdfBuffer = await downloadSamplePdf();
  const pdfBase64 = `data:application/pdf;base64,${samplePdfBuffer.toString('base64')}`;

  for (const b of BOOKS_DATA) {
    console.log(`\nMembuat sampul dan mengunggah buku: "${b.title}"...`);
    const svg = createCoverSvg(b);
    const coverWebp = await sharp(Buffer.from(svg)).webp({ quality: 85 }).toBuffer();
    const coverDataUrl = `data:image/webp;base64,${coverWebp.toString('base64')}`;

    const payload = {
      title: b.title,
      subtitle: b.subtitle,
      author: b.author,
      category: b.category,
      pages: b.pages,
      total_pages: b.pages,
      is_locked: b.is_locked,
      cover_url: coverDataUrl,
      thumbnail_url: coverDataUrl,
      content_url: pdfBase64,
      content_name: `${b.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pdf`,
      content_extension: 'pdf',
      content_mime: 'application/pdf',
      content_size: samplePdfBuffer.byteLength,
      content_type: 'pdf',
      description: b.description,
      updated_at: new Date().toISOString()
    };

    const { data: existing } = await supabaseServer.from('books').select('id').eq('title', b.title).maybeSingle();
    if (existing) {
      console.log(`Buku "${b.title}" sudah ada [ID: ${existing.id}], memperbarui data...`);
      const { error } = await supabaseServer.from('books').update(payload).eq('id', existing.id);
      if (error) console.error(`Gagal memperbarui ${b.title}:`, error);
      else console.log(`✔ Berhasil memperbarui buku ${b.title}`);
    } else {
      const bookId = generateId('buku');
      const { error } = await supabaseServer.from('books').insert({
        ...payload,
        id: bookId,
        created_at: new Date().toISOString()
      });
      if (error) {
        console.error(`Gagal menyimpan buku ${b.title}:`, error);
      } else {
        console.log(`✔ Berhasil menyimpan buku ${b.title} [ID: ${bookId}, Status: ${b.is_locked ? 'PRO' : 'GRATIS'}]`);
      }
    }
  }

  console.log('\nSeeding selesai! Memeriksa jumlah buku di database...');
  const { data: countData } = await supabaseServer.from('books').select('id, title, is_locked, category');
  console.log(`Total buku di database sekarang: ${countData?.length || 0}`);
  countData?.forEach((b, i) => {
    console.log(` ${i + 1}. [${b.is_locked ? 'PRO' : 'FREE'}] ${b.title} (${b.category})`);
  });
}

main().catch((err) => {
  console.error('Terjadi kesalahan pada seeding:', err);
  process.exit(1);
});
