import { jsPDF } from 'jspdf';
import { formatRupiah } from './formatUtils.js';

/**
 * Membuat dan mengunduh berkas PDF kwitansi resmi pembayaran secara instan
 * tanpa perlu memicu dialog window.print() browser.
 *
 * @param {Object} details Informasi transaksi (refNo, dateStr, planName, amount, adminFee, totalPaid, dll)
 * @param {Object} user Informasi pengguna (name, email)
 */
export const downloadReceiptPdf = (details, user) => {
  const refNo = details?.refNo || details?.ref || `WB-${Date.now().toString(36).toUpperCase()}`;
  const dateStr = details?.dateStr || details?.createdAt || new Date().toLocaleString('id-ID');
  const planName = details?.planName || 'Paket Bulanan Pro';
  const amount = Number(details?.amount || 25000);
  const adminFee = Number(details?.adminFee || 0);
  const totalPaid = Number(details?.totalPaid || (amount + adminFee));
  const userName = user?.name || user?.fullName || 'Pengguna Wahidiyah';
  const userEmail = user?.email || '-';

  // Format A5 Portrait (148 x 210 mm) - Sangat cocok untuk ukuran kwitansi / invoice
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a5'
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 148 mm
  const margin = 14;
  const contentWidth = pageWidth - (margin * 2);

  // Background dekorasi header atas (Brand Dark Green #14523A)
  doc.setFillColor(20, 82, 58);
  doc.rect(margin, 12, contentWidth, 24, 'F');

  // Header Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('WAHIDIYAH BOOK', pageWidth / 2, 22, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(240, 245, 240);
  doc.text('Perpustakaan Digital & Dokumen Pengamalan Wahidiyah', pageWidth / 2, 28, { align: 'center' });

  // Badge Status: Pembayaran Lunas
  let y = 43;
  doc.setFillColor(235, 248, 242);
  doc.setDrawColor(33, 107, 76);
  doc.roundedRect(pageWidth / 2 - 38, y - 5, 76, 8, 2, 2, 'FD');
  doc.setTextColor(33, 107, 76);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('PEMBAYARAN LUNAS (SETTLED)', pageWidth / 2, y, { align: 'center' });

  // Garis Pembatas
  y += 10;
  doc.setDrawColor(220, 215, 205);
  doc.setLineWidth(0.3);
  doc.line(margin, y, margin + contentWidth, y);

  // Info Transaksi (2 Kolom)
  y += 7;
  doc.setFontSize(8);
  doc.setTextColor(110, 105, 95);
  doc.text('Nomor Kwitansi', margin, y);
  doc.text('Waktu Transaksi', margin + contentWidth, y, { align: 'right' });

  y += 4.5;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(9);
  doc.text(String(refNo), margin, y);
  doc.text(String(dateStr), margin + contentWidth, y, { align: 'right' });

  y += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(110, 105, 95);
  doc.text('Diterbitkan Untuk', margin, y);
  doc.text('Metode Pembayaran', margin + contentWidth, y, { align: 'right' });

  y += 4.5;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(9);
  doc.text(String(userName), margin, y);
  doc.setTextColor(20, 82, 58);
  doc.text('QRIS Midtrans Core API', margin + contentWidth, y, { align: 'right' });

  if (userEmail && userEmail !== '-') {
    y += 4;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(130, 125, 115);
    doc.text(String(userEmail), margin, y);
  }

  // Tabel Rincian Pembayaran
  y += 9;
  // Header Tabel
  doc.setFillColor(245, 240, 230);
  doc.rect(margin, y, contentWidth, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(70, 65, 55);
  doc.text('Deskripsi Layanan', margin + 3, y + 4.8);
  doc.text('Jumlah', margin + contentWidth - 3, y + 4.8, { align: 'right' });

  // Baris 1: Paket Langganan
  y += 7;
  doc.setDrawColor(230, 225, 215);
  doc.line(margin, y, margin + contentWidth, y);

  y += 5.5;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(8.5);
  doc.text(String(planName), margin + 3, y);
  doc.text(formatRupiah(amount), margin + contentWidth - 3, y, { align: 'right' });

  y += 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(120, 115, 105);
  doc.text('Akses Penuh Seluruh Kitab & Dokumen Pro (30 Hari)', margin + 3, y);

  // Baris 2: Biaya Layanan (jika ada)
  if (adminFee > 0) {
    y += 5;
    doc.setDrawColor(240, 235, 225);
    doc.line(margin, y, margin + contentWidth, y);
    y += 5;
    doc.setFontSize(8);
    doc.setTextColor(90, 85, 75);
    doc.text('Biaya Administrasi & Gateway', margin + 3, y);
    doc.text(formatRupiah(adminFee), margin + contentWidth - 3, y, { align: 'right' });
  }

  // Footer Total Pembayaran
  y += 7;
  doc.setFillColor(235, 245, 238);
  doc.rect(margin, y, contentWidth, 10, 'F');
  doc.setDrawColor(20, 82, 58);
  doc.setLineWidth(0.4);
  doc.line(margin, y, margin + contentWidth, y);

  y += 6.5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(20, 82, 58);
  doc.text('TOTAL PEMBAYARAN', margin + 3, y);
  doc.setFontSize(11);
  doc.text(formatRupiah(totalPaid), margin + contentWidth - 3, y, { align: 'right' });

  // Catatan & Keabsahan Elektronik
  y += 18;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(120, 115, 105);
  doc.text('Bukti pembayaran ini diterbitkan secara elektronik dan sah tanpa tanda tangan basah.', pageWidth / 2, y, { align: 'center' });

  y += 4.5;
  doc.setFontSize(7);
  doc.setTextColor(140, 135, 125);
  doc.text('ID Transaksi Terverifikasi Real Midtrans — Buku Wahidiyah Digital', pageWidth / 2, y, { align: 'center' });

  // Garis Bawah Penutup
  y += 6;
  doc.setDrawColor(230, 225, 215);
  doc.setLineWidth(0.2);
  doc.line(margin + 20, y, margin + contentWidth - 20, y);

  // Unduh dokumen PDF dengan nama berkas terstandarisasi
  const cleanRef = String(refNo).replace(/[^a-zA-Z0-9_-]/g, '_');
  doc.save(`Kwitansi-Wahidiyah-${cleanRef}.pdf`);
};
