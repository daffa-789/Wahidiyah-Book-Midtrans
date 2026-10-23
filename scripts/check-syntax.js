import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';
import pc from 'picocolors';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const scanDirs = ['server', 'scripts'];
let totalChecked = 0;
let failedFiles = [];

function checkDirectory(dir) {
  const fullDir = path.resolve(rootDir, dir);
  if (!fs.existsSync(fullDir)) return;

  const entries = fs.readdirSync(fullDir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(fullDir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules') {
        checkDirectory(path.join(dir, entry.name));
      }
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      totalChecked++;
      try {
        execFileSync(process.execPath, ['--check', fullPath], { stdio: 'pipe' });
      } catch (err) {
        failedFiles.push({ file: path.relative(rootDir, fullPath), error: err.message });
      }
    }
  }
}

for (const dir of scanDirs) {
  checkDirectory(dir);
}

if (failedFiles.length > 0) {
  console.error(pc.red(`\n✖ ${failedFiles.length} berkas JavaScript memiliki kesalahan sintaks:`));
  for (const item of failedFiles) {
    console.error(pc.yellow(`  - ${item.file}: ${item.error}`));
  }
  process.exit(1);
} else {
  console.log(pc.green(`✔ Sintaks ${totalChecked} berkas backend & skrip Node.js lolos verifikasi (0 error)`));
}
