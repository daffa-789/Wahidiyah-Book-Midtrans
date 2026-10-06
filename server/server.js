






import './env.js';

import express from 'express';
import fs from 'fs';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

import {
  SERVE_STATIC,
  STATIC_DIR,
  STATIC_INDEX_FILE,
  FRONTEND_PORT,
  LISTEN_PORT,
  USE_VITE_MIDDLEWARE
} from './config.js';
import {
  authRateLimitedPaths,
  authRateLimiter,
  corsPolicy,
  jsonBody,
  responseCompression,
  securityHeaders,
  trustProxy
} from './middleware/security.js';
import { apiNotFound, errorHandler } from './middleware/errors.js';
import { requestContext } from './middleware/requestLog.js';
import { mountRoutes } from './routes/index.js';
import { NON_SPA_EXTENSIONS } from './lib/constants.js';
import { initOtpStore } from './otpStore.js';
import { canExposeDevOtp } from './lib/otp.js';
import { isMailerConfigured } from './mailer.js';
import { logger, banner } from './logger.js';
import { testConnection } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));


const handleFatal = (label, error) => {
  logger.error('FATAL', `${label} — proses dihentikan`, {
    pesan: error?.message || String(error)
  });
  process.exit(1);
};

process.on('unhandledRejection', (reason) => handleFatal('Unhandled rejection', reason));
process.on('uncaughtException', (error) => handleFatal('Uncaught exception', error));

const app = express();





app.use(requestContext);


app.use(securityHeaders);
app.use(corsPolicy);
app.use(responseCompression);
app.use(jsonBody);





trustProxy(app);
app.use(authRateLimitedPaths, authRateLimiter);


mountRoutes(app);


app.use('/api', apiNotFound);





function mountStatic(app) {
  if (USE_VITE_MIDDLEWARE) {
    
    
    
    
    logger.info('STATIC', 'UI dilayani Vite (middleware) — penyajian dist/ dilewati.');
    return;
  }

  if (!SERVE_STATIC) {
    logger.info('STATIC', 'Penyajian app shell dimatikan (SERVE_STATIC=false) — server hanya melayani API.');
    return;
  }

  if (!fs.existsSync(STATIC_INDEX_FILE)) {
    
    
    
    logger.info('STATIC', 'Mode API-only — UI dilayani Vite di http://localhost:3000.');
    return;
  }

  app.use(express.static(STATIC_DIR, {
    
    
    setHeaders(res, filePath) {
      if (filePath.endsWith(`${path.sep}index.html`)) {
        res.setHeader('Cache-Control', 'no-cache');
      } else if (filePath.includes(`${path.sep}assets${path.sep}`)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
    }
  }));

  
  
  app.get('*', (req, res, next) => {
    const requestPath = String(req.path || '');
    if (requestPath.startsWith('/api')) return next();
    if (NON_SPA_EXTENSIONS.has(path.extname(requestPath).toLowerCase())) return next();
    return res.sendFile(STATIC_INDEX_FILE, (error) => {
      if (error) next(error);
    });
  });
}

mountStatic(app);












let devHttpServer = null;

if (USE_VITE_MIDDLEWARE) {
  const { createServer: createViteServer } = await import('vite');

  devHttpServer = http.createServer(app);

  const vite = await createViteServer({
    
    server: { middlewareMode: true, hmr: { server: devHttpServer } },
    
    appType: 'spa'
  });

  app.use(vite.middlewares);

  logger.info('VITE', 'Vite dipasang sebagai middleware — UI & API berbagi satu port.', {
    port: FRONTEND_PORT
  });
}



app.use(errorHandler);

export { app };




if (process.env.NODE_ENV !== 'test') {
  
  const listenPort = LISTEN_PORT;

  const onReady = async () => {
    banner(
      USE_VITE_MIDDLEWARE ? 'Server Wahidiyah siap — satu alamat' : 'Server Backend Wahidiyah siap',
      [
        `URL            : http://localhost:${listenPort}`,
        'Database       : Supabase Cloud (Skripsi_Project)',
        `Node           : ${process.version} · ${process.platform}`,
        USE_VITE_MIDDLEWARE
          ? 'Mode           : pengembangan (UI Vite + API, satu port)'
          : 'Mode           : mandiri (penyimpanan cloud)'
      ]
    );
    logger.info('BOOT', 'Menginisialisasi koneksi database…');
    await testConnection();

    
    
    
    try {
      const storeMode = await initOtpStore();
      logger.info('BOOT', 'Penyimpanan kode OTP siap', {
        backend: storeMode === 'table' ? 'tabel email_verifications' : 'berkas sementara (.otp-dev-store.json)'
      });
    } catch (storeError) {
      logger.error('BOOT', 'Penyimpanan kode OTP gagal disiapkan — alur OTP tidak akan berfungsi', {
        pesan: storeError.message
      });
    }

    
    
    
    
    
    
    
    
    
    
    
    const mailerOn = isMailerConfigured();
    const devOtpOn = canExposeDevOtp();

    if (mailerOn) {
      logger.ok('BOOT', 'Pengiriman email AKTIF — kode OTP dikirim lewat Gmail API');
    } else if (devOtpOn) {
      logger.warn('BOOT', 'Email BELUM dikonfigurasi — kode OTP ditampilkan di layar verifikasi (devOtp)', {
        cara_mengaktifkan: 'jalankan `node scripts/get-gmail-token.js`, isi GMAIL_REFRESH_TOKEN + GMAIL_SENDER di .env, lalu restart'
      });
    } else {
      logger.error('BOOT', 'JALAN BUNTU OTP: email belum dikonfigurasi DAN kode tidak boleh ditampilkan', {
        sebab: 'GMAIL_REFRESH_TOKEN/GMAIL_SENDER kosong, sementara NODE_ENV bukan "development"',
        akibat: 'tidak ada email terkirim dan tidak ada kode di layar — pendaftaran tidak mungkin diselesaikan',
        perbaikan_1: 'jalankan `npm run dev` (menyetel NODE_ENV=development) untuk sementara waktu',
        perbaikan_2: 'atau isi kredensial Gmail di .env supaya email benar-benar terkirim'
      });
    }
  };

  if (devHttpServer) {
    devHttpServer.listen(listenPort, onReady);
  } else {
    app.listen(listenPort, onReady);
  }
}
