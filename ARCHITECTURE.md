# Architecture & Engineering Guidelines — Buku Wahidiyah

Panduan arsitektur lengkap, evaluasi 30 prinsip kualitas perangkat lunak, dan aturan implementasi AI untuk proyek Perpustakaan Digital Wahidiyah telah didokumentasikan secara menyeluruh di:

👉 [**docs/ARCHITECTURE_AND_ENGINEERING_GUIDELINES.md**](docs/ARCHITECTURE_AND_ENGINEERING_GUIDELINES.md)

---

### Inti Panduan Arsitektur:
1. **Pola Sistem**: Modular Layered Monolith (Routes $\rightarrow$ Controllers $\rightarrow$ Services $\rightarrow$ Supabase Database).
2. **Prinsip Utama (P1)**:
   - *Separation of Concerns*: Route handler Express tipis, logika bisnis murni di Service layer (bebas `req`/`res`).
   - *Idempotency*: Webhook Midtrans QRIS aman dari eksekusi ganda (*prevent double membership activation*).
   - *Security & Robustness*: Rate limiting berlapis, sanitasi input, CSP strict.
   - *Testability*: Service layer dirancang mudah diuji unit test (Vitest).
   - *KISS & YAGNI*: Menghindari over-engineering (Microservices, Kafka, CQRS dihindari).
3. **Standar Desain & Frontend**:
   - Continuous Vertical Scroll PDF (HTML5 Canvas via Mozilla PDF.js).
   - Sistem Warna 3-Color Key (60-30-10) & Standar WCAG AA $\ge 4.5:1$ (`src/lib/styles.js`).
4. **Protokol Model AI**:
   - Dilarang `git push` (hanya lokal commit).
   - Wajib verifikasi melalui `npm run check` (sintaks, audit warna, kontras WCAG AA, dan vite build).

Silakan baca dokumen lengkap di [`docs/ARCHITECTURE_AND_ENGINEERING_GUIDELINES.md`](docs/ARCHITECTURE_AND_ENGINEERING_GUIDELINES.md).
