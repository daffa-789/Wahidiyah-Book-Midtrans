# Arsitektur

Dokumen ini hanya menjadi pengarah. **Master Memory Workflow** adalah satu-satunya memory teknis utama.

Baca [bagian arsitektur, batas lapisan, dan struktur kode](./Master_Memory_Workflow.md#3-arsitektur-sistem--rekayasa-perangkat-lunak-modular-layered-monolith). Ringkasnya, aplikasi memakai modular layered monolith: React/Vite di frontend, Express di backend, layanan bisnis di service layer, dan Supabase sebagai database. Detail aktual mengikuti kode di server/, src/, api/, serta skema di supabase_database/full_setup.sql.

Saat mengubah arsitektur, perbarui Master Memory Workflow; jangan menyalin spesifikasi ke file ini.
