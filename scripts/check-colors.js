import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pc from 'picocolors';

/**
 * Guard warna design system (DESIGN.md v2.6.0 — Seksi 1.5: 3 Color Key & 60-30-10)
 *
 * Melarang kelas palet Tailwind mentah (slate, gray, indigo, rose, amber, dst.)
 * dan `bg-white`/`bg-black` di seluruh `src/`. Warna struktural wajib memakai
 * token: brand-*, cream-*, ink-*, gold-*, ui-*, semantic-*.
 *
 * Whitelist (pengecualian terdokumentasi di DESIGN.md):
 *  - PaymentReceiptModal.jsx : kertas putih kwitansi cetak (print:shown)
 *  - PdfReaderScreen.jsx     : kertas PDF pembaca (tema artikel pembaca)
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const RAW_PALETTE_RE =
  /\b(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}\b/g;

/* Tanpa `\/` di lookahead: varian opasitas (bg-white/50, bg-black/40) juga
   dilanggar — permukaan mono transparan wajib lewat token ink/cream. */
const PLAIN_MONO_RE = /\b(?:bg-white|bg-black|text-black)\b(?!-|\w)/g;

const WHITELIST = new Map([
  [
    path.join('src', 'features', 'payment', 'PaymentReceiptModal.jsx'),
    'Kertas putih kwitansi cetak (diperbolehkan — permukaan print)'
  ],
  [
    path.join('src', 'features', 'reader', 'PdfReaderScreen.jsx'),
    'Kertas PDF pembaca (diperbolehkan — tema artikel pembaca)'
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
  const isWhitelisted = WHITELIST.has(relPath);

  lines.forEach((line, idx) => {
    collect(RAW_PALETTE_RE, line, idx, relPath, 'palet mentah');
    if (!(isWhitelisted && /\bbg-white\b/.test(line))) {
      collect(PLAIN_MONO_RE, line, idx, relPath, 'mono mentah (putih/hitam)');
    }
  });
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
  console.error(pc.cyan('  Whitelist: PaymentReceiptModal.jsx (kwitansi), PdfReaderScreen.jsx (kertas PDF).'));
  process.exit(1);
} else {
  console.log(pc.green(`✔ ${totalScanned} berkas src/ konsisten dengan 3 Color Key & 60-30-10 (0 palet mentah)`));
}
