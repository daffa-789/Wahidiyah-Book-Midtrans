import { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import {
  Area,
  AreaChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip
} from 'recharts';
import {
  BookOpen,
  CheckCircle2,
  FileDown,
  FileSpreadsheet,
  Plus,
  ShieldCheck,
  Trash2,
  UserCog,
  Users
} from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '@context/AppContext';
import { apiJson, authHeaders } from '@lib/api';

import { ADMIN_DEFAULT_TAB, ADMIN_TAB_SLUGS, tabIdFromPath } from '@lib/navigation';
import { normalizeEvent, normalizeTransaction, normalizeUser } from '@lib/normalizers';
import { formatWIB, getTodayStr } from '@lib/date';
import { formatRupiah } from '@lib/formatUtils';
import {
  exportBooksToExcel,
  exportFullReportToExcel,
  exportTransactionsToExcel,
  exportUsersToExcel
} from '@lib/excelExport';
import { EventsTab } from './EventsTab';
import { CarouselTab } from './CarouselTab';
import { LogsTab } from './LogsTab';
import { BookModal } from './BookModal';
import { typography } from '@lib/styles';

const isValidTabSlug = (slug) => slug === undefined || ADMIN_TAB_SLUGS.has(slug);

const EMPTY_BOOK_FORM = {
  title: '',
  subtitle: '',
  author: '',
  category: '',
  pages: '',
  description: '',
  is_locked: false,
  thumbnail: null,
  content: null
};

const EMPTY_EVENT_FORM = {
  title: '',
  event_date: '',
  time_start: '19:30',
  time_end: '21:00',
  location: '',
  category: 'Mujahadah',
  description: '',
  organizer: 'DPP PSW',
  show_in_carousel: false
};

const toEventForm = (event) => ({
  title: event.title || '',
  event_date: String(event.date || '').slice(0, 10),
  time_start: event.timeStart || '19:30',
  time_end: event.timeEnd || '21:00',
  location: event.location || '',
  category: event.category || 'Mujahadah',
  description: event.description || '',
  organizer: event.organizer || 'DPP PSW',
  show_in_carousel: Boolean(event.showInCarousel)
});

const formatCurrency = formatRupiah;

export const AdminDashboard = () => {
  const {
    user,
    sessionToken,
    books,
    refreshBooks,
    refreshEvents,
    navigateTo,
    updateUserRole,
    logout,
    carouselSlides,
    refreshCarousel
  } = useApp();

  const { tab: tabParam } = useParams();

  const activeTab = tabParam === undefined
    ? ADMIN_DEFAULT_TAB
    : tabIdFromPath(`/admin/${tabParam}`);
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [events, setEvents] = useState([]);
  const [error, setError] = useState('');
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [bookForm, setBookForm] = useState(EMPTY_BOOK_FORM);
  const [currentCalDate, setCurrentCalDate] = useState(() => new Date());
  const [selectedCalDate, setSelectedCalDate] = useState(() => getTodayStr());
  const [agendaFilter, setAgendaFilter] = useState('Semua');
  const [eventForm, setEventForm] = useState(() => ({
    ...EMPTY_EVENT_FORM,
    event_date: getTodayStr()
  }));
  const [isSavingEvent, setIsSavingEvent] = useState(false);
  const [editingEventId, setEditingEventId] = useState(null);
  const [carouselReady, setCarouselReady] = useState(true);
  const [isSavingBook, setIsSavingBook] = useState(false);

  const headers = useMemo(() => authHeaders(sessionToken), [sessionToken]);

  const loadDashboard = useCallback(async () => {
    if (!sessionToken) return;
    setError('');
    try {
      const [statsPayload, userPayload, transactionPayload, eventPayload, carouselPayload] = await Promise.all([
        apiJson('/api/stats', { headers }),
        apiJson('/api/users', { headers }),
        apiJson('/api/transactions', { headers }),
        apiJson('/api/events'),

        apiJson('/api/carousel/all', { headers })
      ]);
      setStats(statsPayload.stats);

      setUsers((userPayload.users || []).map(normalizeUser));
      setTransactions((transactionPayload.transactions || []).map(normalizeTransaction));
      setEvents((eventPayload.events || []).map(normalizeEvent));
      setCarouselReady(carouselPayload.carouselReady !== false);
      await Promise.all([refreshBooks(), refreshEvents(), refreshCarousel()]);
    } catch (loadError) {
      setError(loadError.message || 'Dashboard tidak dapat dimuat.');
    }
  }, [headers, refreshBooks, refreshEvents, refreshCarousel, sessionToken]);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  const monthlyRevenue = useMemo(() => {
    const groups = new Map();
    transactions.filter((item) => item.status === 'success').forEach((item) => {
      const date = new Date(item.createdAt);
      if (Number.isNaN(date.getTime())) return;
      const label = date.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' });
      groups.set(label, (groups.get(label) || 0) + Number(item.totalPaid || 0));
    });
    return [...groups.entries()].map(([month, revenue]) => ({ month, revenue }));
  }, [transactions]);

  const subscriptionShare = useMemo(() => {
    const pro = users.filter((item) => Boolean(item.isPro)).length;
    const regular = Math.max(users.length - pro, 0);
    return [
      { name: 'Pro', value: pro, color: '#14523A' },
      { name: 'Reguler', value: regular, color: '#D4AF4F' }
    ].filter((item) => item.value > 0);
  }, [users]);

  const updateUser = async (id, body, successMessage) => {
    try {
      await apiJson(`/api/users/${encodeURIComponent(id)}${body.role ? '/role' : '/pro'}`, {
        method: 'PUT',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      toast.success(successMessage);

      if (body.role) {
        const isSelfRoleChange = user?.id === id;
        updateUserRole(id, body.role);
        if (!isSelfRoleChange) await loadDashboard();
        return;
      }

      await loadDashboard();
    } catch (updateError) {
      toast.error(updateError.message || 'Data pengguna belum dapat diperbarui.');
    }
  };

  const deleteBook = async (book) => {
    if (!window.confirm(`Hapus buku “${book.title}”? Lampiran dan halaman terkait juga akan dihapus.`)) return;
    try {
      await apiJson(`/api/books/${encodeURIComponent(book.id)}`, { method: 'DELETE', headers });
      toast.success('Buku berhasil dihapus.');
      await loadDashboard();
    } catch (deleteError) {
      toast.error(deleteError.message || 'Buku belum dapat dihapus.');
    }
  };

  const submitBook = async (event) => {
    event.preventDefault();
    if (!bookForm.content) {
      toast.error('Pilih lampiran konten buku terlebih dahulu.');
      return;
    }
    setIsSavingBook(true);
    try {
      const data = new FormData();
      Object.entries(bookForm).forEach(([key, value]) => {
        if (key !== 'thumbnail' && key !== 'content' && value !== '' && value !== null) {
          data.append(key, String(value));
        }
      });
      data.set('is_locked', bookForm.is_locked ? 'true' : 'false');
      if (bookForm.thumbnail instanceof File) {
        data.set('thumbnail', bookForm.thumbnail);
      }
      if (bookForm.content instanceof File) {
        data.set('content', bookForm.content);
      }

      await apiJson('/api/books/upload', { method: 'POST', headers, body: data, timeoutMs: 120000 });
      toast.success('Buku dan lampirannya berhasil ditambahkan.');
      setBookForm(EMPTY_BOOK_FORM);
      setIsBookModalOpen(false);
      await loadDashboard();
    } catch (submitError) {
      toast.error(submitError.message || 'Buku belum dapat disimpan.');
    } finally {
      setIsSavingBook(false);
    }
  };

  const submitEvent = async (event) => {
    event.preventDefault();
    setIsSavingEvent(true);
    try {
      if (editingEventId) {
        await apiJson(`/api/events/${encodeURIComponent(editingEventId)}`, {
          method: 'PUT',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify(eventForm)
        });
        toast.success('Agenda berhasil diperbarui.');
      } else {
        await apiJson('/api/events', {
          method: 'POST',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify(eventForm)
        });
        toast.success('Agenda berhasil ditambahkan.');
      }
      const savedDate = eventForm.event_date || selectedCalDate;
      setSelectedCalDate(savedDate);
      if (savedDate && !Number.isNaN(new Date(savedDate).getTime())) {
        const d = new Date(savedDate);
        setCurrentCalDate(new Date(d.getFullYear(), d.getMonth(), 1));
      }
      setEditingEventId(null);
      setEventForm({ ...EMPTY_EVENT_FORM, event_date: savedDate });
      await loadDashboard();
    } catch (submitError) {
      toast.error(submitError.message || 'Agenda belum dapat disimpan.');
    } finally {
      setIsSavingEvent(false);
    }
  };

  const editEvent = (event) => {
    setEditingEventId(event.id);
    setEventForm(toEventForm(event));
    const dateStr = String(event.date || '').slice(0, 10);
    if (dateStr && !Number.isNaN(new Date(dateStr).getTime())) {
      setSelectedCalDate(dateStr);
      const parsed = new Date(dateStr);
      setCurrentCalDate(new Date(parsed.getFullYear(), parsed.getMonth(), 1));
    }
  };

  const cancelEditEvent = () => {
    setEditingEventId(null);
    setEventForm({ ...EMPTY_EVENT_FORM, event_date: selectedCalDate });
  };

  const toggleEventCarousel = async (event) => {
    try {
      await apiJson(`/api/events/${encodeURIComponent(event.id)}`, {
        method: 'PUT',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...toEventForm(event),
          show_in_carousel: !event.showInCarousel
        })
      });
      toast.success(event.showInCarousel ? 'Agenda dikeluarkan dari carousel.' : 'Agenda masuk ke carousel.');
      await loadDashboard();
    } catch (toggleError) {
      toast.error(toggleError.message || 'Status carousel agenda gagal diubah.');
    }
  };

  const deleteEvent = async (event) => {
    if (!window.confirm(`Hapus agenda “${event.title}”?`)) return;
    try {
      await apiJson(`/api/events/${encodeURIComponent(event.id)}`, { method: 'DELETE', headers });
      toast.success('Agenda berhasil dihapus.');
      await loadDashboard();
    } catch (deleteError) {
      toast.error(deleteError.message || 'Agenda belum dapat dihapus.');
    }
  };

  const handleExportFull = () => {
    try {
      const res = exportFullReportToExcel({ users, transactions, books, events, stats });
      toast.success(`Laporan lengkap berhasil diunduh (${res.fileName})`);
    } catch (err) {
      toast.error(err.message || 'Gagal mengekspor laporan.');
    }
  };

  const handleExportTransactions = () => {
    try {
      const res = exportTransactionsToExcel(transactions);
      toast.success(`${res.count} data transaksi berhasil diekspor (${res.fileName})`);
    } catch (err) {
      toast.error(err.message || 'Gagal mengekspor data transaksi.');
    }
  };

  const handleExportUsers = () => {
    try {
      const res = exportUsersToExcel(users);
      toast.success(`${res.count} data pengguna berhasil diekspor (${res.fileName})`);
    } catch (err) {
      toast.error(err.message || 'Gagal mengekspor data pengguna.');
    }
  };

  const handleExportBooks = () => {
    try {
      const res = exportBooksToExcel(books);
      toast.success(`${res.count} data buku berhasil diekspor (${res.fileName})`);
    } catch (err) {
      toast.error(err.message || 'Gagal mengekspor katalog buku.');
    }
  };

  const kpis = [
    { label: 'Total pengguna', value: stats?.totalUsers ?? 0, icon: Users, tone: 'text-sky-600 bg-sky-50 border-sky-100' },
    { label: 'Koleksi aktif', value: stats?.totalBooks ?? books.length, icon: BookOpen, tone: 'text-brand-600 bg-brand-50 border-brand-100' },
    { label: 'Langganan aktif', value: stats?.activeSubscriptions ?? 0, icon: ShieldCheck, tone: 'text-violet-600 bg-violet-50 border-violet-100' },
    { label: 'Pendapatan tervalidasi', value: formatCurrency(stats?.totalRevenue), icon: CheckCircle2, tone: 'text-amber-600 bg-amber-50 border-amber-100' }
  ];

  if (!isValidTabSlug(tabParam)) {
    return <Navigate to="/admin/ringkasan" replace />;
  }

  return (
    <div className="min-h-screen bg-cream-100 text-ink-900">

      <main className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto min-w-0">

          {error && (
            <div role="alert" className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              <span>{error}</span>
              <button type="button" onClick={loadDashboard} className="min-h-6 rounded-xl border border-rose-300 bg-cream-50 px-3 py-1.5 text-xs font-bold text-rose-700 transition hover:bg-rose-100">
                Coba muat ulang
              </button>
            </div>
          )}

          {activeTab === 'overview' && (
            <section className="space-y-6">
              <div className={layout.toolbarRow}>
                <div>
                  <h2 className={typography.sectionTitlePlain}>Ringkasan operasional</h2>
                  <p className={typography.helper}>Semua angka diambil langsung dari database Supabase Cloud.</p>
                </div>
                <div className={layout.rowWrap}>
                  <button
                    type="button"
                    onClick={handleExportTransactions}
                    className="inline-flex items-center gap-2 rounded-2xl border border-cream-300 bg-white px-3.5 py-2.5 text-xs font-bold text-ink-700 shadow-sm transition hover:bg-cream-100"
                    title="Ekspor seluruh riwayat transaksi & keuangan ke Excel"
                  >
                    <FileDown className="h-4 w-4 text-emerald-600" />
                    Export Transaksi ({transactions.length})
                  </button>
                  <button
                    type="button"
                    onClick={handleExportFull}
                    className="inline-flex items-center gap-2 rounded-2xl bg-brand-700 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-brand-800"
                    title="Ekspor buku kerja lengkap (Semua sheet: KPI, Transaksi, Pengguna, Buku, Agenda)"
                  >
                    <FileSpreadsheet className="h-4 w-4 text-amber-300" />
                    Export Laporan Lengkap (.xlsx)
                  </button>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {kpis.map((kpi) => {
                  const Icon = kpi.icon;
                  return <div key={kpi.label} className="rounded-3xl border border-cream-300 bg-cream-50 p-4 shadow-sm">
                    <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-2xl border ${kpi.tone}`}><Icon className="h-5 w-5" /></div>
                    <p className="text-2xl font-black tracking-tight">{kpi.value}</p>
                    <p className="mt-1 text-xs font-medium text-ink-400">{kpi.label}</p>
                  </div>;
                })}
              </div>

              <div className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(250px,1fr)]">
                <div className={surfaces.panel}>
                  <h3 className="font-bold">Tren pendapatan tervalidasi</h3>
                  <div className="mt-4 h-64">
                    {monthlyRevenue.length ? <ResponsiveContainer width="100%" height="100%"><AreaChart data={monthlyRevenue}><defs><linearGradient id="revenue" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#14523A" stopOpacity={0.35}/><stop offset="100%" stopColor="#14523A" stopOpacity={0}/></linearGradient></defs><Tooltip formatter={(value) => formatCurrency(value)} /><Area type="monotone" dataKey="revenue" stroke="#14523A" fill="url(#revenue)" strokeWidth={3} /></AreaChart></ResponsiveContainer> : <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-cream-300 bg-cream-100 text-center text-sm text-ink-300">Belum ada transaksi tervalidasi.</div>}
                  </div>
                </div>
                <div className={surfaces.panel}>
                  <h3 className="font-bold">Status langganan</h3>
                  <div className="mt-4 h-48">
                    {subscriptionShare.length ? <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={subscriptionShare} dataKey="value" innerRadius={48} outerRadius={72} paddingAngle={3}>{subscriptionShare.map((entry) => <Cell key={entry.name} fill={entry.color} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer> : <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-cream-300 bg-cream-100 text-center text-sm text-ink-300">Belum ada pengguna.</div>}
                  </div>
                  <div className="space-y-2">{subscriptionShare.map((entry) => <div key={entry.name} className="flex items-center justify-between text-xs"><span className="flex items-center gap-2 text-ink-500"><span className="h-2.5 w-2.5 rounded-full" style={{ background: entry.color }} />{entry.name}</span><strong>{entry.value}</strong></div>)}</div>
                </div>
              </div>

              <div className={surfaces.panelSpaced}>
                <div className={layout.toolbarRow}>
                  <div>
                    <h3 className="font-bold text-ink-900">Riwayat Transaksi Langganan</h3>
                    <p className={typography.helperTight}>Daftar transaksi pembayaran Pro melalui QRIS Midtrans ({transactions.length} total).</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleExportTransactions}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-cream-300 bg-white px-3 py-1.5 text-xs font-bold text-ink-700 shadow-sm transition hover:bg-cream-100"
                  >
                    <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
                    Unduh Excel
                  </button>
                </div>
                <div className="overflow-x-auto rounded-2xl border border-cream-200">
                  <table className="min-w-full text-left text-xs">
                    <thead className="bg-cream-100 uppercase tracking-wider text-ink-400">
                      <tr>
                        <th className="px-3.5 py-2.5">No. Referensi</th>
                        <th className="px-3.5 py-2.5">Pelanggan</th>
                        <th className="px-3.5 py-2.5">Paket</th>
                        <th className="px-3.5 py-2.5">Total Bayar</th>
                        <th className="px-3.5 py-2.5">Status</th>
                        <th className="px-3.5 py-2.5">Waktu</th>
                      </tr>
                    </thead>
                    <tbody className={layout.divider}>
                      {transactions.slice(0, 10).map((tx) => (
                        <tr key={tx.id || tx.refNo}>
                          <td className="px-3.5 py-2.5 font-mono font-bold text-ink-700">{tx.refNo}</td>
                          <td className="px-3.5 py-2.5">
                            <p className="font-bold text-ink-900">{tx.userName || '-'}</p>
                            <p className={typography.helperInline}>{tx.userEmail || ''}</p>
                          </td>
                          <td className="px-3.5 py-2.5">{tx.planName || 'Paket Bulanan'}</td>
                          <td className="px-3.5 py-2.5 font-bold text-ink-900">{formatCurrency(tx.totalPaid)}</td>
                          <td className="px-3.5 py-2.5">
                            <span className={`inline-flex rounded-full px-2 py-0.5 text-micro font-bold ${
                              tx.status === 'success'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : tx.status === 'pending'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}>
                              {tx.status === 'success' ? 'Sukses' : tx.status === 'pending' ? 'Pending' : 'Gagal'}
                            </span>
                          </td>
                          <td className="px-3.5 py-2.5 text-ink-400">{formatWIB(tx.createdAt, { withSeconds: false })}</td>
                        </tr>
                      ))}
                      {transactions.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-ink-400">
                            Belum ada riwayat transaksi pembayaran.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}

          {activeTab === 'books' && (
            <section className="space-y-5">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                <div>
                  <h2 className={typography.sectionTitlePlain}>Koleksi buku</h2>
                  <p className={typography.helper}>Unggah thumbnail dan lampiran bacaan. Tidak ada tombol unduh di pembaca.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleExportBooks}
                    className="inline-flex items-center gap-2 rounded-2xl border border-cream-300 bg-white px-3.5 py-3 text-xs font-bold text-ink-700 shadow-sm transition hover:bg-cream-100"
                    title="Ekspor daftar koleksi buku ke Excel"
                  >
                    <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                    Export Excel
                  </button>
                  <button type="button" onClick={() => setIsBookModalOpen(true)} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-700 px-4 py-3 text-xs font-bold text-white shadow-sm transition hover:bg-brand-800">
                    <Plus className="h-4 w-4" /> Tambah buku
                  </button>
                </div>
              </div>
              <div className="overflow-hidden rounded-3xl border border-cream-300 bg-cream-50 shadow-sm">
                {books.length === 0 ? <div className="p-12 text-center"><BookOpen className={controls.emptyIcon} /><p className="mt-3 font-bold text-ink-700">Koleksi masih kosong</p><p className={typography.helper}>Tambahkan buku pertama beserta thumbnail dan lampirannya.</p></div> : <div className={layout.divider}>{books.map((book) => <div key={book.id} className="flex flex-wrap items-center gap-4 p-4"><div className="h-14 w-11 overflow-hidden rounded-xl bg-gradient-to-tr from-brand-800 to-brand-800 flex items-center justify-center text-white shrink-0 shadow-sm">{book.coverUrl ? <img src={book.coverUrl} alt={book.title} className={layout.media} onError={(e) => { e.currentTarget.style.display = 'none'; }} /> : <BookOpen className="h-5 w-5 text-white/80" />}</div><div className="min-w-[180px] flex-1"><p className="font-bold text-ink-900">{book.title}</p><p className={typography.helperTight}>{book.author} • {book.category}</p><p className="mt-1 text-caption text-ink-500">{book.contentName || 'Tanpa lampiran'} {book.isLocked ? '• Pro' : ''}</p></div><button type="button" onClick={() => deleteBook(book)} className="rounded-xl border border-rose-200 p-2 text-rose-600 transition hover:bg-rose-50" title="Hapus buku"><Trash2 className="h-4 w-4" /></button></div>)}</div>}
              </div>
            </section>
          )}

          {activeTab === 'users' && (
            <section className="space-y-5">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                <div>
                  <h2 className={typography.sectionTitlePlain}>Pengguna</h2>
                  <p className={typography.helper}>Role, metode masuk, dan status Pro tersimpan langsung di Supabase Cloud.</p>
                </div>
                <button
                  type="button"
                  onClick={handleExportUsers}
                  className="inline-flex items-center gap-2 rounded-2xl border border-cream-300 bg-white px-3.5 py-2.5 text-xs font-bold text-ink-700 shadow-sm transition hover:bg-cream-100"
                  title="Ekspor seluruh pengguna ke Excel"
                >
                  <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                  Export Excel ({users.length})
                </button>
              </div>
              <div className="overflow-x-auto rounded-3xl border border-cream-300 bg-cream-50 shadow-sm"><table className="min-w-full text-left text-sm"><thead className="bg-cream-100 text-xs uppercase tracking-wider text-ink-400"><tr><th className="px-4 py-3">Pengguna</th><th className="px-4 py-3">Metode</th><th className="px-4 py-3">Role</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Aksi</th></tr></thead><tbody className={layout.divider}>{users.map((item) => <tr key={item.id}><td className="px-4 py-3"><p className="font-bold">{item.name}</p><p className="text-xs text-ink-400">{item.email}</p></td><td className="px-4 py-3">{item.loginMethod === 'google' ? <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 border border-blue-100"><span className="h-1.5 w-1.5 rounded-full bg-blue-500"></span>Google</span> : <span className="inline-flex items-center gap-1.5 rounded-full bg-cream-200 px-2.5 py-1 text-xs font-bold text-ink-500 border border-cream-300/60"><span className="h-1.5 w-1.5 rounded-full bg-ink-300"></span>Email</span>}</td><td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${item.role === 'admin' ? 'bg-violet-50 text-violet-700' : 'bg-cream-200 text-ink-500'}`}>{item.role}</span></td><td className="px-4 py-3"><span className={`text-xs font-bold ${item.isPro ? 'text-brand-700' : 'text-ink-400'}`}>{item.isPro ? 'Pro aktif' : 'Reguler'}</span></td><td className="px-4 py-3"><button type="button" onClick={() => updateUser(item.id, { role: item.role === 'admin' ? 'user' : 'admin' }, 'Role pengguna diperbarui.')} className="rounded-xl border border-cream-300 px-2.5 py-1.5 text-xs font-bold text-ink-500 hover:bg-cream-100"><UserCog className="mr-1 inline h-3.5 w-3.5" />{item.role === 'admin' ? 'Jadikan user' : 'Jadikan admin'}</button></td></tr>)}{users.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center">
                        <p className="font-bold text-ink-700">Belum ada pengguna</p>
                        <p className={typography.helper}>Akun yang mendaftar atau masuk lewat Google akan muncul di daftar ini.</p>
                      </td>
                    </tr>
                  )}</tbody></table></div>
            </section>
          )}

          {activeTab === 'events' && (
            <EventsTab
              events={events}
              eventForm={eventForm}
              setEventForm={setEventForm}
              isSavingEvent={isSavingEvent}
              submitEvent={submitEvent}
              deleteEvent={deleteEvent}
              currentCalDate={currentCalDate}
              setCurrentCalDate={setCurrentCalDate}
              selectedCalDate={selectedCalDate}
              setSelectedCalDate={setSelectedCalDate}
              agendaFilter={agendaFilter}
              setAgendaFilter={setAgendaFilter}
              editingEventId={editingEventId}
              editEvent={editEvent}
              cancelEditEvent={cancelEditEvent}
              toggleEventCarousel={toggleEventCarousel}
            />
          )}
          {activeTab === 'carousel' && (
            <CarouselTab
              slides={carouselSlides}
              carouselReady={carouselReady}
              refreshCarousel={refreshCarousel}
              sessionToken={sessionToken}
            />
          )}
          {activeTab === 'logs' && (
            <LogsTab sessionToken={sessionToken} />
          )}
        </main>

      {isBookModalOpen && (
        <BookModal
          isOpen={isBookModalOpen}
          onClose={() => setIsBookModalOpen(false)}
          bookForm={bookForm}
          setBookForm={setBookForm}
          onSubmit={submitBook}
          isSavingBook={isSavingBook}
        />
      )}
    </div>
  );
};
