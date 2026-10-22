import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pc from 'picocolors';

/* Penghitung rasio kontras WCAG 2.1 untuk pasangan token yang benar-benar
 * dipakai antarmuka. Sumber kebenaran: component.json (LIGHT + colors.dark),
 * dan fallback statis di src/index.css ikut diperiksa agar keduanya tidak
 * drift — aturan repo: ubah token beserta fallback-nya pada commit yang sama.
 *
 * Ambang: teks normal 4.5:1 (AA), teks besar 3:1, indikator non-teks 3:1
 * (SC 1.4.11). Angka 18.66px ≈ 14pt, batas "teks besar" WCAG.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const AA_TEXT = 4.5;
const AA_LARGE = 3;
const AA_UI = 3;

const kebab = (value) => value.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();

const flattenColors = (group, prefix = '', out = {}) => {
  for (const [key, value] of Object.entries(group)) {
    if (key === 'note') continue;
    const name = prefix ? `${prefix}-${kebab(key)}` : kebab(key);
    if (value && typeof value === 'object') flattenColors(value, name, out);
    else if (typeof value === 'string') out[name] = value.toLowerCase();
  }
  return out;
};

const normalizeHex = (raw) => {
  const value = String(raw).trim().toLowerCase();
  if (/^#[0-9a-f]{6}$/.test(value)) return value;
  if (/^#[0-9a-f]{3}$/.test(value)) {
    const [r, g, b] = value.slice(1).split('');
    return `#${r}${r}${g}${g}${b}${b}`;
  }
  const parts = value.split(/\s+/).map(Number);
  if (parts.length === 3 && parts.every((n) => Number.isFinite(n))) {
    return `#${parts.map((n) => n.toString(16).padStart(2, '0')).join('')}`;
  }
  return null;
};

const selectorMatches = (selector, wanted) => selector
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .split(',')
  .map((part) => part.trim())
  .filter(Boolean)
  .some((part) => part === wanted);

/* Ambil seluruh deklarasi variabel pada blok top-level yang selector-nya
 * tepat `:root` (bisa berupa daftar) atau `.dark`. Blok lain (mis.
 * `.dark .app-surface .bg-ink-900`) sengaja diabaikan: itu override utilitas,
 * bukan definisi token.
 */
const parseThemeVars = (css, wanted) => {
  const vars = {};
  for (const match of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (!selectorMatches(match[1], wanted)) continue;
    for (const decl of match[2].matchAll(/--([a-z0-9-]+)\s*:\s*([^;]+);/g)) {
      const hex = normalizeHex(decl[2]);
      if (hex) vars[decl[1]] = hex;
    }
  }
  return vars;
};

const channelLinear = (byte) => {
  const c = byte / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};

const luminance = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return 0.2126 * channelLinear(r) + 0.7152 * channelLinear(g) + 0.0722 * channelLinear(b);
};

const ratio = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

/* Pasangan yang dijaga. `bg` dipakai pada mode terang, `bgDark` dipakai pada
 * mode malam bila permukaannya beralih ke panel yang sengaja tetap gelap
 * (`--night-panel`), misalnya sidebar DeviceFrame.
 */
const ON_PANEL = { bg: 'ink-900', bgDark: 'night-panel' };

const PAIRS = [
  { fg: 'ink-500', bg: 'cream-50', min: AA_TEXT, use: 'teks bantu & meta (styles.js typography.helper/meta)' },
  { fg: 'ink-500', bg: 'ui-surface', min: AA_TEXT, use: 'teks bantu di panel surface' },
  { fg: 'ink-500', bg: 'ui-card', min: AA_TEXT, use: 'teks bantu di kartu' },
  { fg: 'ink-500', bg: 'cream-100', min: AA_TEXT, use: 'teks dropzone (styles.js surfaces.dropzone)' },
  { fg: 'ink-800', bg: 'cream-50', min: AA_TEXT, use: 'teks isi utama' },
  { fg: 'ink-700', bg: 'cream-50', min: AA_TEXT, use: 'label bidang (styles.js typography.fieldLabel)' },
  { fg: 'ink-400', bg: 'cream-50', min: AA_LARGE, use: 'ink-400 kini khusus teks besar/non-teks' },
  { fg: 'brand-600', bg: 'cream-50', min: AA_UI, ui: true, use: 'ring fokus (styles.js controls.input/select)' },
  { fg: 'brand-700', bg: 'cream-50', min: AA_TEXT, use: 'tautan dan teks brand' },
  { fg: 'gold-600', bg: 'cream-50', min: AA_TEXT, use: 'aksen emas' },
  { fg: 'semantic-danger', bg: 'cream-50', min: AA_TEXT, use: 'pesan galat di latar terang' },
  { fg: 'semantic-warning', bg: 'cream-50', min: AA_TEXT, use: 'pesan peringatan di latar terang' },
  { fg: 'semantic-info', bg: 'cream-50', min: AA_TEXT, use: 'pesan info di latar terang' },
  { fg: 'semantic-success', bg: 'cream-50', min: AA_TEXT, use: 'pesan sukses di latar terang' },
  { fg: 'semantic-danger-on-dark', ...ON_PANEL, min: AA_TEXT, use: 'ikon & ring item Keluar di sidebar' },
  { fg: 'semantic-muted-on-dark', ...ON_PANEL, min: AA_TEXT, use: 'label nav non-aktif + toggle ciutkan' },
  { fg: 'brand-500', ...ON_PANEL, min: AA_UI, ui: true, use: 'ring fokus nav non-destruktif di sidebar' }
];

const tokens = JSON.parse(fs.readFileSync(path.resolve(rootDir, 'component.json'), 'utf8'));
const css = fs.readFileSync(path.resolve(rootDir, 'src/index.css'), 'utf8');

const { dark: DARK_TOKENS, ...lightGroups } = tokens.colors;
const tokenLight = flattenColors(lightGroups);
const tokenDark = flattenColors(DARK_TOKENS);
const cssLight = parseThemeVars(css, ':root');
const cssDark = parseThemeVars(css, '.dark');

let failures = 0;
const lines = [];

for (const [name, tokenValue] of Object.entries(tokenLight)) {
  const cssValue = cssLight[name];
  if (cssValue && cssValue !== tokenValue) {
    failures += 1;
    lines.push(pc.red(`✖ drift LIGHT  --${name}: component.json=${tokenValue} index.css=${cssValue}`));
  }
}
for (const [name, tokenValue] of Object.entries(tokenDark)) {
  const cssValue = cssDark[name];
  if (cssValue && cssValue !== tokenValue) {
    failures += 1;
    lines.push(pc.red(`✖ drift DARK   --${name}: component.json=${tokenValue} index.css=${cssValue}`));
  }
}

const resolve = (name, theme) => (theme === 'dark' ? (cssDark[name] ?? cssLight[name]) : cssLight[name]);

for (const pair of PAIRS) {
  for (const variant of ['light', 'dark']) {
    const bgName = variant === 'dark' && pair.bgDark ? pair.bgDark : pair.bg;
    const fg = resolve(pair.fg, variant);
    const bg = resolve(bgName, variant);
    const ambang = pair.ui ? `≥ ${pair.min} (non-teks)` : `≥ ${pair.min}`;
    if (!fg || !bg) {
      failures += 1;
      lines.push(pc.red(`✖ tidak bisa dihitung: --${pair.fg} di atas --${bgName} [${variant}] — variabel token hilang`));
      continue;
    }
    const value = ratio(fg, bg);
    if (value + 0.005 >= pair.min) {
      lines.push(pc.green(`✔ ${value.toFixed(2)}:1  ${fg} di atas ${bg}  [${variant}] ${ambang} — ${pair.use}`));
    } else {
      failures += 1;
      lines.push(pc.red(`✖ ${value.toFixed(2)}:1  ${fg} di atas ${bg}  [${variant}] ${ambang} — ${pair.use}`));
    }
  }
}

console.log(pc.bold(`\nGerbang kontras WCAG — ${PAIRS.length} pasangan diperiksa`));
for (const line of lines) console.log(`  ${line}`);

if (failures) {
  console.log(pc.red(`\n${failures} pelanggaran kontras/drift token. Perbaiki tokennya di component.json + src/index.css, bukan hex di komponen.`));
  process.exit(1);
}

console.log(pc.green('\nSemua pasangan kontras lulus ambang dan token sinkron dengan fallback.'));
