import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const frontendPort = Number(env.VITE_PORT || 3000);
  const backendPort = Number(env.PORT || 5000);

  return {
    plugins: [react()],
    resolve: {
      // Alias path — R29 (restrukturisasi folder).
      // Sebelumnya setiap berkas memakai import relatif '../../' yang rapuh:
      // memindahkan satu folder merusak puluhan berkas sekaligus. Dengan alias,
      // import jadi absolut & stabil terhadap perpindahan.
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        '@features': fileURLToPath(new URL('./src/features', import.meta.url)),
        '@ui': fileURLToPath(new URL('./src/components/ui', import.meta.url)),
        '@lib': fileURLToPath(new URL('./src/lib', import.meta.url)),
        '@data': fileURLToPath(new URL('./src/data', import.meta.url)),
        '@context': fileURLToPath(new URL('./src/context', import.meta.url)),
        '@theme': fileURLToPath(new URL('./src/theme', import.meta.url)),
      }
    },
    build: {
      chunkSizeWarningLimit: 700,
      rollupOptions: {
        output: {
          manualChunks(id) {
            // Urutan penting: cek paling spesifik lebih dulu. Vite memanggil
            // fungsi ini per-modul, dan cabang pertama yang cocok menang.
            //
            // R25 — pemisahan diperluas. Sebelumnya hanya recharts/d3, lucide, dan
            // react-dom yang dipecah; sisanya menumpuk di chunk `index` yang jadi
            // 419 KB (terbesar di seluruh build) padahal itu bundle jalur-kritis
            // yang dimuat SEMUA pengunjung, termasuk yang cuma membuka /login.
            //
            // Yang dipindahkan dan alasannya:
            //
            // R37 — nama chunk `supabase` DIGANTI jadi `supabase-sdk`.
            // `src/lib/supabase.js` (pembungkus milik sendiri) juga menghasilkan
            // chunk bernama `supabase`, sehingga build memunculkan DUA berkas
            // berbeda dengan nama yang sama (`supabase-B4WnJLNZ.js` 226 KB dan
            // `supabase-CwXGP15H.js` 2,2 KB). Secara fungsi tidak rusak, tetapi
            // mustahil dipelihara: tidak ada yang bisa menebak berkas mana yang
            // mana dari namanya saja, dan laporan ukuran jadi menyesatkan.
            //
            // • @supabase/supabase-js — ±190 KB. HANYA dipakai PaymentConfirmScreen
            //   (lazy) + ServerStatusBanner. Semula ikut ke `index` karena rollup
            //   menaikkan modul yang di-import dari jalur eager (ServerStatusBanner
            //   ada di DeviceFrame). Dipecah supaya bisa ditunda.
            // • @headlessui/react — hanya DeviceFrame (dialog/drawer). Kecil, tapi
            //   membebaskan `index` dari React-nya headlessui.
            // • sonner — Toaster global; sekali pakai di 5 berkas, tab sendiri.
            if (id.includes('node_modules/recharts') || id.includes('node_modules/d3-')) {
              return 'charts';
            }
            if (id.includes('node_modules/xlsx')) {
              return 'excel';
            }
            if (id.includes('node_modules/@supabase/')) {
              return 'supabase-sdk';
            }
                        if (id.includes('node_modules/@headlessui/')) {
              return 'headlessui';
            }
            if (id.includes('node_modules/sonner')) {
              return 'sonner';
            }
            if (id.includes('node_modules/lucide-react')) {
              return 'icons';
            }
            if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/') || id.includes('node_modules/scheduler/')) {
              return 'vendor';
            }
          }
        }
      }
    },
    server: {
      port: frontendPort,
      open: false,
      host: true,
      // Panaskan modul jalur-kritis saat server start.
      //
      // Tanpa ini, MUAT PERTAMA setelah server dinyalakan memakan ~5 detik:
      // Vite baru meng-optimasi dependensi dan mentransformasi modul ketika ada
      // permintaan masuk, sehingga peramban menampilkan halaman kosong selama
      // itu — terasa seperti "macet" padahal hanya belum siap. Dengan pemanasan,
      // transformasi dikerjakan lebih dulu di latar belakang dan muat pertama
      // jauh lebih cepat.
      warmup: {
        clientFiles: [
          './src/main.jsx',
          './src/App.jsx',
          './src/context/AppContext.jsx',
          './src/features/auth/LoginScreen.jsx'
        ]
      },
      proxy: {
        '/api': {
          target: `http://localhost:${backendPort}`,
          changeOrigin: true,
          xfwd: true
        }
      }
    }
  };
})
