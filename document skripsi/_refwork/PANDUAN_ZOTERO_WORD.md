# Panduan Zotero ↔ Microsoft Word (Wahidiyah Book)

**Tanggal:** 9 Oktober 2026
**Proyek:** Proposal Skripsi — Ghazalah Ramadhan Daffa Firjatullah (20232210156)

---

## Status Integrasi (sudah siap)

| Komponen | Status |
|---|---|
| Zotero Desktop | ✅ Terpasang & berjalan (Local API aktif di `127.0.0.1:23119`) |
| Plugin Zotero untuk Word (`Zotero.dotm`) | ✅ Terpasang di `%APPDATA%\Microsoft\Word\STARTUP\Zotero.dotm` |
| Library Zotero | ✅ Berisi 67 artikel jurnal, termasuk 18 referensi SINTA proposal ini |
| Metadata 18 item | ✅ Sudah dirapikan (nama penulis dipisah benar) |

> Catatan: ada file sisa `~$Zotero.dotm` di folder STARTUP. Aman diabaikan; boleh dihapus bila Word tertutup.

---

## Cara Menyisipkan Sitasi Otomatis (Zotero Field) di Word

1. **Buka** `Proposal_Skripsi_Rancang_Bangun_20232210156.docx` di Microsoft Word.
2. Pastikan tab **Zotero** muncul di Ribbon. Jika belum: `File → Options → Add-ins`, pilih *Word Add-ins*, lalu centang `Zotero.dotm`.
3. **Sitasi per kalimat:**
   - Letakkan kursor di titik sitasi.
   - Klik tab **Zotero → Add/Edit Citation**.
   - Dialog cepat muncul → ketik judul/penulis → pilih item → tekan **Enter**.
   - Ulangi untuk sitasi lain. Zotero otomatis mengurutkan & memformat (APA 7th).
4. **Daftar pustaka otomatis:**
   - Letakkan kursor di bawah judul **DAFTAR PUSTAKA**.
   - Klik tab **Zotero → Add/Edit Bibliography**.
   - Zotero menggantikan/mengisi daftar pustaka dari item yang dikutip.
   - Klik kanan daftar → **Update Field** bila ada perubahan.
5. **Ganti gaya sitasi:** tab **Zotero → Document Preferences → pilih "American Psychological Association 7th edition"** → OK.

> ⚠️ Penting: setelah memakai field Zotero, **jangan** edit daftar pustaka secara manual — edit di Zotero, lalu **Refresh** di Word.

---

## 18 Item SINTA (sudah ada di library Zotero)

| No | Penulis (Tahun) | Zotero Key | DOI |
|----|-----------------|-----------|-----|
| 1 | Alexandro & Parhusip (2025) | `YQYRBJ46` | 10.33197/jitter.vol12.iss1.2025.3250 |
| 2 | Alfilaeni dkk. (2024) | `P3LP8SAD` | 10.22303/csrid-.16.3.2024.27-39 |
| 3 | Gustiegan & Painem (2022) | `C2VDTJXY` | 10.36080/bit.v19i1.1835 |
| 4 | Kusumaningrum dkk. (2023) | `C84SPDEX` | 10.30742/melekitjournal.v9i1.275 |
| 5 | Kusumo dkk. (2021) | `BLNBP7U2` | 10.51998/jsi.v10i2.422 |
| 6 | Minarni & Sigit (2023) | `IVJ4WUTW` | 10.32664/j-intech.v11i1.820 |
| 7 | Muhammad & Paputungan (2024) | `3YZ24G5G` | 10.20885/snati.v3.i2.35 |
| 8 | Mulyani & Hati (2021) | `C3CKIH7Z` | 10.51998/jsi.v9i1.413 |
| 9 | Muttaqin dkk. (2022) | `EUZYFPG3` | 10.33592/jutis.v10i2.2825 |
| 10 | Nariswari dkk. (2023) | `785NYGZN` | 10.30656/jsii.v10i2.8183 |
| 11 | Pudoli dkk. (2023) | `CUERWR7U` | 10.38101/ajcsr.v5i2.9410 |
| 12 | Putri (2022) | `TCKRY67T` | 10.32664/smatika.v12i01.682 |
| 13 | Rachman dkk. (2024) | `4JQGGM8Y` | 10.14421/ekbis.2024.8.1.2134 |
| 14 | Rezkiandra (2024) | `R27HFGQ5` | 10.18495/jsi.v16i2.2 |
| 15 | Richo dkk. (2021) | `X2YSDDRP` | 10.35889/jutisi.v10i2.657 |
| 16 | Suhardi (2023) | `SDSZ37PR` | 10.33395/sinkron.v8i1.11922 |
| 17 | Widya & Wakhidah (2022) | `AQPXGG6H` | 10.32764/newton.v1i3.2064 |
| 18 | Wijana & Prasetio (2023) | `7WPMDFWC` | 10.37424/informasi.v15i2.260 |

---

## Cara Membuat Daftar Pustaka via CLI (bila perlu regenerate)

```bash
zotero-cli export \
  --item-keys "YQYRBJ46,P3LP8SAD,C2VDTJXY,C84SPDEX,BLNBP7U2,IVJ4WUTW,3YZ24G5G,C3CKIH7Z,EUZYFPG3,785NYGZN,CUERWR7U,TCKRY67T,4JQGGM8Y,R27HFGQ5,X2YSDDRP,SDSZ37PR,AQPXGG6H,7WPMDFWC" \
  --style apa --format bib
```

---

## Troubleshooting

| Masalah | Solusi |
|---|---|
| Tab Zotero tidak muncul di Word | Tutup Word → pastikan `Zotero.dotm` ada di `%APPDATA%\Microsoft\Word\STARTUP\` → buka lagi. |
| "Zotero is not running" | Buka aplikasi Zotero Desktop dulu. |
| Daftar pustaka tidak update | Klik kanan daftar → **Update Field**, atau tab Zotero → **Refresh**. |
| Sitasi muncul sebagai kode abu-abu | Tekan `Alt+F9` untuk toggle field code. |
| Field error setelah edit manual | Jangan edit manual; edit di Zotero → Refresh. |
