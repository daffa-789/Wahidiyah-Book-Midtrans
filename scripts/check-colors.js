import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pc from 'picocolors';

/**
 * Guard warna design system (DESIGN.md di akar repo — Seksi 1.5: 3 Color Key & 60-30-10)
 *
 * Melarang di seluruh `src/`:
 *  - kelas palet Tailwind mentah (slate, gray, indigo, rose, amber, dst.)
 *  - `bg-white` / `bg-black` / `text-black`
 *  - `text-white` / `ring-black` / `border-white` (D-01, D-02)
 *  - hex arbitrer `bg-[#…]`, `text-[#…]`, dan variannya
 *
 * Warna struktural wajib memakai token: brand-*, cream-*, ink-*, gold-*,
 * ui-*, semantic-* — hanya lewat token nilai mode malam bisa ikut berganti.
 *
 * Whitelist (pengecualian terdokumentasi di DESIGN.md, per baris):
 *  - PaymentReceiptModal.jsx : kertas putih kwitansi cetak (print:shown)
 *  - PdfReaderScreen.jsx     : kertas PDF pembaca (tema artikel pembaca)
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const RAW_PALETTE_RE =
  /\b(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}\b/g;

/* Tanpa `\/` di lookahead: varian opasitas (bg-white/50, border-white/10) juga
   dilanggar — permukaan mono transparan wajib lewat token ink/cream. */
const PLAIN_MONO_RE = /\b(?:bg-white|bg-black|text-black)\b(?!-|\w)/g;

/* D-01/D-02: teks putih mentah dan cincin hitam mentah tidak membaca token,
   sehingga ikut rusak saat mode malam membalik nilai CSS variable. */
const RAW_ON_SURFACE_RE = /\b(?:text-white|ring-black|border-white)\b(?!-|\w)/g;

/* Hex arbitrer melewati sistem token sepenuhnya. */
const ARBITRARY_COLOR_RE = /\b(?:bg|text|border|ring|fill|from|via|to|stroke)-\[#/g;

/* ── Nama token harus persis sama dengan kunci warna di tailwind.config.js ──
 * Kelas dengan nama token yang salah TIDAK menghasilkan utilitas apa pun,
 * sehingga warna jatuh ke nilai warisan: teks jadi tak terlihat tanpa satu pun
 * error. Ini bukan teori — `text-semantic-muted-on-dark` pernah lolos karena
 * kunci aslinya camelCase (`mutedOnDark`), dan label sidebar jadi hitam di
 * atas panel hitam pada mode terang.
 *
 * Hanya grup berkunci camelCase yang diperiksa (semantic, ui). Grup bernomor
 * (brand/cream/ink/gold/qris) tidak rawan salah tulis bentuk ini.
 */
const twConfig = await import(new URL('../tailwind.config.js', import.meta.url));
const TOKEN_GROUPS = {
  semantic: Object.keys(twConfig.default.theme.extend.colors.semantic),
  ui: Object.keys(twConfig.default.theme.extend.colors.ui)
};
const TOKEN_CLASS_RE =
  /(?:[A-Za-z0-9_-]+:)*(?:text|bg|border|ring|fill|divide|shadow|outline|decoration|stroke)-(semantic|ui)-([A-Za-z0-9]+(?:-[A-Za-z0-9]+)*)(?![\w-])/g;

const kebab = (value) => value.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();

function checkTokenNames(relPath, content) {
  TOKEN_CLASS_RE.lastIndex = 0;
  let match;
  while ((match = TOKEN_CLASS_RE.exec(content)) !== null) {
    const [, group, name] = match;
    const known = TOKEN_GROUPS[group];
    if (known.includes(name)) continue;
    const line = content.slice(0, match.index).split(/\r?\n/).length;
    const saran = known.find((key) => kebab(key) === name);
    violations.push({
      file: relPath,
      line,
      token: `${group}-${name}`,
      kind: saran
        ? `token tak dikenal — utilitas tidak pernah dibuat (mungkin maksudmu "${saran}")`
        : 'token tak dikenal — utilitas tidak pernah dibuat'
    });
  }
}

/* Whitelist = permukaan yang MEMANG putih/hitam secara desain (kertas cetak,
   tema artikel pembaca) dan punya paletnya sendiri di luar 3 Color Key.
   `allow` berisi pola yang diizinkan pada baris itu saja. */
const WHITELIST = new Map([
  [
    path.join('src', 'features', 'payment', 'PaymentReceiptModal.jsx'),
    {
      reason: 'Kertas putih kwitansi cetak (diperbolehkan — permukaan print)',
      allow: [/\bbg-white\b/]
    }
  ],
  [
    path.join('src', 'features', 'reader', 'PdfReaderScreen.jsx'),
    {
      reason: 'Kertas PDF pembaca (diperbolehkan — tema artikel pembaca punya palet sendiri)',
      allow: [/\bbg-white\b/, /\btext-white\b/, /\bborder-white\b/, /-\[#/]
    }
  ]
]);

const scanDirs = ['src'];
let totalScanned = 0;
const violations = [];

function walk(dir) {
  const fullDir = path.resolve(rootDir, dir);
  if (!fs.existsSync(fullDir)) return;

  for (const entry of fs.readdirSync(fullDir, { withFileTypes: true })) {
    const rel = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules') walk(rel);
    } else if (entry.isFile() && /\.(jsx?|tsx?)$/.test(entry.name)) {
      totalScanned++;
      scanFile(path.resolve(rootDir, rel), rel);
    }
  }
}

function scanFile(fullPath, relPath) {
  const content = fs.readFileSync(fullPath, 'utf8');
  const lines = content.split(/\r?\n/);
  const allowed = WHITELIST.get(relPath)?.allow || [];
  const isAllowed = (line) => allowed.some((pattern) => pattern.test(line));

  lines.forEach((line, idx) => {
    /* Palet mentah tetap dilarang di berkas whitelist sekalipun — pengecualian
       hanya untuk permukaan putih/hitam dan hex yang memang paletnya sendiri. */
    collect(RAW_PALETTE_RE, line, idx, relPath, 'palet mentah');
    if (isAllowed(line)) return;
    collect(PLAIN_MONO_RE, line, idx, relPath, 'mono mentah (putih/hitam)');
    collect(RAW_ON_SURFACE_RE, line, idx, relPath, 'teks/cincin/garis mono di atas permukaan');
    collect(ARBITRARY_COLOR_RE, line, idx, relPath, 'hex arbitrer');
  });

  checkTokenNames(relPath, content);
}

function collect(regex, line, idx, relPath, kind) {
  regex.lastIndex = 0;
  let match;
  while ((match = regex.exec(line)) !== null) {
    violations.push({ file: relPath, line: idx + 1, token: match[0], kind });
  }
}

for (const dir of scanDirs) {
  walk(dir);
}

if (violations.length > 0) {
  console.error(pc.red(`\n✖ ${violations.length} pelanggaran 3 Color Key (DESIGN.md seksi 1.5):`));
  for (const v of violations) {
    console.error(pc.yellow(`  - ${v.file}:${v.line} → "${v.token}" (${v.kind})`));
  }
  console.error(pc.cyan('\n  Ganti dengan token: brand-*, cream-*, ink-*, gold-*, ui-*, semantic-*.'));
  console.error(pc.cyan('  teks di permukaan gelap  → text-cream-50   |  garis tipis → border-cream-50/10'));
  console.error(pc.cyan('  Whitelist per-baris: PaymentReceiptModal.jsx (kwitansi cetak), PdfReaderScreen.jsx (kertas PDF).'));
  process.exit(1);
} else {
  console.log(pc.green(`✔ ${totalScanned} berkas src/ konsisten dengan 3 Color Key & 60-30-10 (0 palet mentah)`));
}
