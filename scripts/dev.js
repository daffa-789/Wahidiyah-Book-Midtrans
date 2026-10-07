

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import net from 'net';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
dotenv.config({ path: path.resolve(rootDir, '.env') });

const systemRoot = process.env.SystemRoot || 'C:\\Windows';
const system32 = path.join(systemRoot, 'System32');
const env = { ...process.env };
if (process.platform === 'win32') {
  const currentPath = env.PATH || env.Path || '';
  if (!currentPath.toLowerCase().includes('system32')) {
    env.PATH = `${system32};${currentPath}`;
  }
}

function probePort(port, host = '127.0.0.1', timeout = 1000) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let done = false;
    socket.setTimeout(timeout);
    socket.once('connect', () => {
      done = true;
      socket.destroy();
      resolve(true);
    });
    socket.once('timeout', () => {
      if (!done) {
        done = true;
        socket.destroy();
        resolve(false);
      }
    });
    socket.once('error', () => {
      if (!done) {
        done = true;
        socket.destroy();
        resolve(false);
      }
    });
    socket.connect(port, host);
  });
}

async function freePorts(ports = [3000, 5000]) {
  if (process.platform !== 'win32') return;
  for (const port of ports) {
    const isBusy = await probePort(port);
    if (!isBusy) continue;
    console.log(`\x1b[33m[DEV] Port ${port} terikat proses lain. Memeriksa pemilik port...\x1b[0m`);
    try {

      const ps = spawn('powershell', [
        '-NoProfile',
        '-Command',
        `$conns = Get-NetTCPConnection -State Listen -LocalPort ${port} -ErrorAction SilentlyContinue; ` +
        `foreach ($c in $conns) { ` +
        `$p = Get-Process -Id $c.OwningProcess -ErrorAction SilentlyContinue; ` +
        `if ($p -and $p.ProcessName -eq 'node') { Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue; Write-Output ("KILL " + $p.Id + " " + $p.ProcessName) } ` +
        `elseif ($p) { Write-Output ("SKIP " + $p.Id + " " + $p.ProcessName) } }`
      ], { stdio: 'pipe' });
      let out = '';
      ps.stdout.on('data', (d) => { out += d.toString(); });
      await new Promise((resolve) => ps.on('close', resolve));
      for (const line of out.split('\n').map(s => s.trim()).filter(Boolean)) {
        if (line.startsWith('KILL')) {
          console.log(`\x1b[33m[DEV]   → proses node dihentikan: PID ${line.slice(5)}\x1b[0m`);
        } else if (line.startsWith('SKIP')) {
          console.log(`\x1b[33m[DEV]   → dilewati, bukan proses node: PID ${line.slice(5)}\x1b[0m`);
        }
      }
      await new Promise(r => setTimeout(r, 800));
    } catch {}
  }
}

const nodeExec = process.execPath;
const serverScript = path.resolve(rootDir, 'server', 'server.js');

async function startDev() {
  console.log('\x1b[32m⚡ [DATABASE] Menggunakan Database Cloud Supabase (Skripsi_Project)\x1b[0m');
  console.log('\x1b[36m   Mode satu port: Express menyalakan server, Vite dipasang di dalamnya.\x1b[0m');

  await freePorts([3000, 5000]);

  const watchPath = path.resolve(rootDir, 'server');
  const serverProc = spawn(nodeExec, [`--watch-path=${watchPath}`, serverScript], {
    cwd: rootDir,

    env: { ...env, VITE_MIDDLEWARE: '1', NODE_ENV: 'development' },

    stdio: 'inherit'
  });

  const killTree = (child) => {
    if (!child || !child.pid) return;
    try {
      if (process.platform === 'win32') {
        spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
      } else {
        child.kill('SIGKILL');
      }
    } catch {}
  };

  let isCleaningUp = false;
  const cleanup = () => {
    if (isCleaningUp) return;
    isCleaningUp = true;
    console.log('\n\x1b[33m[DEV] Menghentikan layanan...\x1b[0m');
    killTree(serverProc);
    setTimeout(() => process.exit(0), 300);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
  process.on('exit', cleanup);

  serverProc.on('close', (code) => {
    if (!isCleaningUp && code !== 0 && code !== 3221225786 && code !== null) {
      console.error('\x1b[31m[DEV] Server berhenti.\x1b[0m');
    }
  });
}

startDev();
