

import * as XLSX from 'xlsx';
import { formatWIB } from '@lib/date';
import { formatRupiah } from '@lib/formatUtils';

const calculateColWidths = (rows) => {
  if (!rows || !rows.length) return [];
  const keys = Object.keys(rows[0]);
  return keys.map((key) => {
    let maxLen = key.length;
    for (const row of rows) {
      const val = row[key];
      const strVal = val === null || val === undefined ? '' : String(val);
      if (strVal.length > maxLen) {
        maxLen = strVal.length;
      }
    }

    return { wch: Math.min(Math.max(maxLen + 4, 10), 60) };
  });
};

const getFileDateSuffix = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const exportUsersToExcel = (users = []) => {
  if (!users.length) {
    throw new Error('Tidak ada data pengguna untuk diekspor.');
  }

  const rows = users.map((u, idx) => ({
    'No': idx + 1,
    'ID Pengguna': u.id || '-',
    'Nama Lengkap': u.name || '-',
    'Alamat Email': u.email || '-',
    'Role Akun': u.role === 'admin' ? 'Administrator' : 'User (Pengguna)',
    'Metode Masuk': u.loginMethod === 'google' ? 'Google OAuth' : 'Email & Password',
    'Status Member': u.isPro ? 'Pro Aktif' : 'Reguler (Gratis)',
    'Masa Aktif Pro': u.subscriptionExpiresAt ? formatWIB(u.subscriptionExpiresAt) : '-',
    'Tanggal Lahir': u.dob || '-',
    'Tanggal Terdaftar': formatWIB(u.createdAt)
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = calculateColWidths(rows);

  XLSX.utils.book_append_sheet(wb, ws, 'Data Pengguna');
  const fileName = `Laporan_Pengguna_Wahidiyah_${getFileDateSuffix()}.xlsx`;
  XLSX.writeFile(wb, fileName);
  return { fileName, count: rows.length };
};

export const exportTransactionsToExcel = (transactions = []) => {
  if (!transactions.length) {
    throw new Error('Tidak ada data transaksi untuk diekspor.');
  }

  const rows = transactions.map((t, idx) => {
    let statusLabel = 'Menunggu';
    if (t.status === 'success') statusLabel = 'Berhasil';
    else if (t.status === 'rejected') statusLabel = 'Ditolak';

    return {
      'No': idx + 1,
      'No. Referensi': t.refNo || '-',
      'ID Transaksi': t.id || '-',
      'Nama Pembeli': t.userName || '-',
      'Email Pembeli': t.userEmail || '-',
      'Paket Langganan': t.planName || 'Paket Bulanan',
      'Nominal (Rp)': Number(t.amount || 0),
      'Biaya Admin (Rp)': Number(t.adminFee || 0),
      'Total Bayar (Rp)': Number(t.totalPaid || 0),
      'Metode Pembayaran': t.paymentMethod || 'QRIS',
      'Status Transaksi': statusLabel,
      'Tanggal Transaksi': formatWIB(t.createdAt),
      'Waktu Verifikasi': t.verifiedAt ? formatWIB(t.verifiedAt) : '-'
    };
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = calculateColWidths(rows);

  XLSX.utils.book_append_sheet(wb, ws, 'Data Transaksi');
  const fileName = `Laporan_Transaksi_Wahidiyah_${getFileDateSuffix()}.xlsx`;
  XLSX.writeFile(wb, fileName);
  return { fileName, count: rows.length };
};

export const exportBooksToExcel = (books = []) => {
  if (!books.length) {
    throw new Error('Tidak ada data buku untuk diekspor.');
  }

  const rows = books.map((b, idx) => ({
    'No': idx + 1,
    'ID Buku': b.id || '-',
    'Judul Buku': b.title || '-',
    'Subjudul': b.subtitle || '-',
    'Penulis': b.author || '-',
    'Kategori': b.category || 'Umum',
    'Akses Konten': b.isLocked ? 'Member Pro Eksklusif' : 'Semua Pembaca (Gratis)',
    'Jumlah Halaman': b.totalPages || b.pages || 0,
    'Format Lampiran': (b.contentExtension || b.contentType || 'PDF').toUpperCase(),
    'Nama File': b.contentName || 'Belum diunggah',
    'Deskripsi Ringkas': b.description || '-',
    'Tanggal Unggah': formatWIB(b.createdAt)
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = calculateColWidths(rows);

  XLSX.utils.book_append_sheet(wb, ws, 'Katalog Buku');
  const fileName = `Laporan_Katalog_Buku_Wahidiyah_${getFileDateSuffix()}.xlsx`;
  XLSX.writeFile(wb, fileName);
  return { fileName, count: rows.length };
};

export const exportEventsToExcel = (events = []) => {
  if (!events.length) {
    throw new Error('Tidak ada data agenda untuk diekspor.');
  }

  const rows = events.map((e, idx) => ({
    'No': idx + 1,
    'ID Agenda': e.id || '-',
    'Judul Kegiatan': e.title || '-',
    'Tanggal Acara': e.date || '-',
    'Waktu Pelaksanaan': e.time || '-',
    'Lokasi Acara': e.location || 'Online / Belum ditentukan',
    'Kategori': e.category || 'Umum',
    'Penyelenggara': e.organizer || 'DPP PSW',
    'Keterangan': e.description || '-',
    'Tanggal Dibuat': formatWIB(e.createdAt)
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = calculateColWidths(rows);

  XLSX.utils.book_append_sheet(wb, ws, 'Agenda Kegiatan');
  const fileName = `Laporan_Agenda_Wahidiyah_${getFileDateSuffix()}.xlsx`;
  XLSX.writeFile(wb, fileName);
  return { fileName, count: rows.length };
};

export const exportFullReportToExcel = ({
  users = [],
  transactions = [],
  books = [],
  events = [],
  stats = null
}) => {
  const wb = XLSX.utils.book_new();

  const successTx = transactions.filter((t) => t.status === 'success');
  const totalRevenue = successTx.reduce((acc, curr) => acc + Number(curr.totalPaid || 0), 0);
  const proCount = users.filter((u) => Boolean(u.isPro)).length;

  const summaryRows = [
    { 'Metrik Laporan': 'Nama Aplikasi', 'Keterangan': 'Perpustakaan Digital Wahidiyah' },
    { 'Metrik Laporan': 'Tanggal Cetak Laporan', 'Keterangan': formatWIB(new Date(), { withSeconds: true }) },
    { 'Metrik Laporan': 'Zona Waktu', 'Keterangan': 'WIB (Asia/Jakarta, UTC+7)' },
    { 'Metrik Laporan': 'Total Pengguna Terdaftar', 'Keterangan': `${users.length} akun` },
    { 'Metrik Laporan': 'Pengguna Member Pro Aktif', 'Keterangan': `${proCount} akun` },
    { 'Metrik Laporan': 'Pengguna Reguler', 'Keterangan': `${Math.max(users.length - proCount, 0)} akun` },
    { 'Metrik Laporan': 'Total Judul Buku', 'Keterangan': `${books.length} judul` },
    { 'Metrik Laporan': 'Total Agenda Kegiatan', 'Keterangan': `${events.length} agenda` },
    { 'Metrik Laporan': 'Total Transaksi Sukses', 'Keterangan': `${successTx.length} transaksi` },
    { 'Metrik Laporan': 'Total Pendapatan Tervalidasi', 'Keterangan': formatRupiah(totalRevenue) },
  ];

  const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
  wsSummary['!cols'] = [{ wch: 32 }, { wch: 45 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan Eksekutif');

  if (transactions.length > 0) {
    const txRows = transactions.map((t, idx) => ({
      'No': idx + 1,
      'No. Referensi': t.refNo || '-',
      'Nama Pembeli': t.userName || '-',
      'Email Pembeli': t.userEmail || '-',
      'Paket': t.planName || 'Paket Bulanan',
      'Nominal (Rp)': Number(t.amount || 0),
      'Biaya Admin (Rp)': Number(t.adminFee || 0),
      'Total Bayar (Rp)': Number(t.totalPaid || 0),
      'Metode': t.paymentMethod || 'QRIS',
      'Status': t.status === 'success' ? 'Berhasil' : t.status === 'pending' ? 'Menunggu' : 'Ditolak',
      'Tanggal Transaksi': formatWIB(t.createdAt),
      'Tanggal Verifikasi': t.verifiedAt ? formatWIB(t.verifiedAt) : '-'
    }));
    const wsTx = XLSX.utils.json_to_sheet(txRows);
    wsTx['!cols'] = calculateColWidths(txRows);
    XLSX.utils.book_append_sheet(wb, wsTx, 'Transaksi');
  }

  if (users.length > 0) {
    const userRows = users.map((u, idx) => ({
      'No': idx + 1,
      'Nama Lengkap': u.name || '-',
      'Email': u.email || '-',
      'Role': u.role === 'admin' ? 'Administrator' : 'User',
      'Metode Masuk': u.loginMethod === 'google' ? 'Google' : 'Email',
      'Status Pro': u.isPro ? 'Pro' : 'Reguler',
      'Masa Aktif Pro': u.subscriptionExpiresAt ? formatWIB(u.subscriptionExpiresAt) : '-',
      'Terdaftar Pada': formatWIB(u.createdAt)
    }));
    const wsUsers = XLSX.utils.json_to_sheet(userRows);
    wsUsers['!cols'] = calculateColWidths(userRows);
    XLSX.utils.book_append_sheet(wb, wsUsers, 'Pengguna');
  }

  if (books.length > 0) {
    const bookRows = books.map((b, idx) => ({
      'No': idx + 1,
      'Judul': b.title || '-',
      'Penulis': b.author || '-',
      'Kategori': b.category || 'Umum',
      'Akses': b.isLocked ? 'Pro' : 'Gratis',
      'Halaman': b.totalPages || b.pages || 0,
      'Format': (b.contentExtension || b.contentType || 'PDF').toUpperCase(),
      'Nama File': b.contentName || '-'
    }));
    const wsBooks = XLSX.utils.json_to_sheet(bookRows);
    wsBooks['!cols'] = calculateColWidths(bookRows);
    XLSX.utils.book_append_sheet(wb, wsBooks, 'Katalog Buku');
  }

  if (events.length > 0) {
    const eventRows = events.map((e, idx) => ({
      'No': idx + 1,
      'Judul': e.title || '-',
      'Tanggal': e.date || '-',
      'Waktu': e.time || '-',
      'Lokasi': e.location || '-',
      'Kategori': e.category || 'Umum',
      'Penyelenggara': e.organizer || '-'
    }));
    const wsEvents = XLSX.utils.json_to_sheet(eventRows);
    wsEvents['!cols'] = calculateColWidths(eventRows);
    XLSX.utils.book_append_sheet(wb, wsEvents, 'Agenda');
  }

  const fileName = `Laporan_Lengkap_Perpustakaan_Wahidiyah_${getFileDateSuffix()}.xlsx`;
  XLSX.writeFile(wb, fileName);
  return { fileName, sheetsCount: wb.SheetNames.length };
};
