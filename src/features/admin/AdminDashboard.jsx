import { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useApp } from '@context/AppContext';
import { apiJson, authHeaders } from '@lib/api';
import { supabase } from '@lib/supabase';

import { ADMIN_DEFAULT_TAB, ADMIN_TAB_SLUGS, tabIdFromPath } from '@lib/navigation';
import { normalizeEvent, normalizeTransaction, normalizeUser } from '@lib/normalizers';
import { getTodayStr } from '@lib/date';
import { withToast, withToastSync } from '@lib/withToast';
import { OverviewTab } from './OverviewTab';
import { BooksTab } from './BooksTab';
import { UsersTab } from './UsersTab';
import { EventsTab } from './EventsTab';
import { CarouselTab } from './CarouselTab';
import { LogsTab } from './LogsTab';
import { BookModal } from './BookModal';
import { AdminSkeleton } from '@ui/Skeleton';

const isValidTabSlug = (slug) => slug === undefined || ADMIN_TAB_SLUGS.has(slug);

const EMPTY_BOOK_FORM = {
  title: '',
  pages: '',
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
  location_name: '',
  maps_url: '',
  category: 'Mujahadah',
  description: '',
  organizer: 'DPP PSW',
  show_in_carousel: false,
  broadcast_notification: true
};

const toEventForm = (event) => {
  const rawLoc = String(event.location || '').trim();
  let locName = rawLoc;
  let mapUrl = '';
  if (rawLoc.includes('|')) {
    const parts = rawLoc.split('|');
    const urlPart = parts.find((p) => /^https?:\/\//i.test(p.trim())) || '';
    const namePart = parts.find((p) => p !== urlPart) || parts[0];
    locName = namePart.trim();
    mapUrl = urlPart.trim();
  } else if (/^https?:\/\//i.test(rawLoc)) {
    locName = '';
    mapUrl = rawLoc;
  }
  return {
    title: event.title || '',
    event_date: String(event.date || '').slice(0, 10),
    time_start: event.timeStart || '19:30',
    time_end: event.timeEnd || '21:00',
    location: event.location || '',
    location_name: locName,
    maps_url: mapUrl,
    category: event.category || 'Mujahadah',
    description: event.description || '',
    organizer: event.organizer || 'DPP PSW',
    show_in_carousel: Boolean(event.showInCarousel),
    broadcast_notification: false
  };
};

export const AdminDashboard = () => {
  const {
    user,
    sessionToken,
    books,
    refreshBooks,
    refreshEvents,
    updateUserRole,
    carouselSlides,
    refreshCarousel
  } = useApp();

  const { tab: tabParam } = useParams();

  const activeTab = tabParam === undefined
    ? ADMIN_DEFAULT_TAB
    : tabIdFromPath(`/admin/${tabParam}`);
  const [stats, setStats] = useState(null);
  const [loadingDashboard, setLoadingDashboard] = useState(true);
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
  const [editingBookId, setEditingBookId] = useState(null);

  const headers = useMemo(() => authHeaders(sessionToken), [sessionToken]);

  const loadDashboard = useCallback(async () => {
    if (!sessionToken) return;
    setError('');
    setLoadingDashboard(true);
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
    } finally {
      setLoadingDashboard(false);
    }
  }, [headers, refreshBooks, refreshEvents, refreshCarousel, sessionToken]);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  const updateUser = (id, body, successMessage) => withToast(
    async () => {
      await apiJson(`/api/users/${encodeURIComponent(id)}${body.role ? '/role' : '/pro'}`, {
        method: 'PUT',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (body.role) {
        const isSelfRoleChange = user?.id === id;
        updateUserRole(id, body.role);
        if (!isSelfRoleChange) await loadDashboard();
        return;
      }

      await loadDashboard();
    },
    'Data pengguna belum dapat diperbarui.',
    successMessage
  );

  const deleteBook = (book) => {
    if (!window.confirm(`Hapus buku “${book.title}”? Lampiran dan halaman terkait juga akan dihapus.`)) return undefined;
    return withToast(
      async () => {
        await apiJson(`/api/books/${encodeURIComponent(book.id)}`, { method: 'DELETE', headers });
        await loadDashboard();
      },
      'Buku belum dapat dihapus.',
      'Buku berhasil dihapus.'
    );
  };

  const submitBook = async (event) => {
    event.preventDefault();
    if (!editingBookId && !bookForm.thumbnail) {
      toast.error('Pilih berkas thumbnail terlebih dahulu.');
      return;
    }
    if (!editingBookId && !bookForm.content) {
      toast.error('Pilih lampiran konten buku terlebih dahulu.');
      return;
    }
    setIsSavingBook(true);
    return withToast(
      async () => {
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
          const berkas = bookForm.content;
          if (!supabase) throw new Error('Supabase Storage belum terkonfigurasi.');
          const tiket = await apiJson('/api/books/upload-intent', {
            method: 'POST',
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({ filename: berkas.name })
          });
          /* Byte naskah dikirim peramban langsung ke Supabase Storage. Melalui
           * /api/books/upload ia akan ditolak Vercel di atas 4,5 MB.
           */
          const { error } = await supabase.storage
            .from(tiket.bucket)
            .uploadToSignedUrl(tiket.path, tiket.token, berkas);
          if (error) throw error;
          data.set('content_path', tiket.path);
          data.set('content_name', berkas.name);
        }

        if (editingBookId) {
          await apiJson(`/api/books/${encodeURIComponent(editingBookId)}`, {
            method: 'PUT',
            headers,
            body: data,
            timeoutMs: 120000
          });
          toast.success('Buku berhasil diperbarui.');
        } else {
          await apiJson('/api/books/upload', {
            method: 'POST',
            headers,
            body: data,
            timeoutMs: 120000
          });
          toast.success('Buku berhasil ditambahkan.');
        }
        setBookForm(EMPTY_BOOK_FORM);
        setEditingBookId(null);
        setIsBookModalOpen(false);
        await loadDashboard();
      },
      editingBookId ? 'Buku belum dapat diperbarui.' : 'Buku belum dapat disimpan.'
    ).finally(() => setIsSavingBook(false));
  };

  const startEditBook = (book) => {
    setEditingBookId(book.id);
    setBookForm({
      title: book.title || '',
      pages: String(book.pages || ''),
      is_locked: Boolean(book.isLocked),
      thumbnail: null,
      cover_url: book.coverUrl || '',
      content: null,
      content_name: book.contentName || ''
    });
    setIsBookModalOpen(true);
  };

  const submitEvent = async (event) => {
    event.preventDefault();
    setIsSavingEvent(true);
    return withToast(
      async () => {
        if (editingEventId) {
          const locationCombined = eventForm.maps_url?.trim()
            ? (eventForm.location_name?.trim() ? `${eventForm.location_name.trim()} | ${eventForm.maps_url.trim()}` : eventForm.maps_url.trim())
            : (eventForm.location_name?.trim() || eventForm.location || '');
          const eventPayload = {
            ...eventForm,
            location: locationCombined
          };
          const res = await apiJson(`/api/events/${encodeURIComponent(editingEventId)}`, {
            method: 'PUT',
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify(eventPayload)
          });
          toast.success(res?.message || 'Agenda berhasil diperbarui.');
        } else {
          const locationCombined = eventForm.maps_url?.trim()
            ? (eventForm.location_name?.trim() ? `${eventForm.location_name.trim()} | ${eventForm.maps_url.trim()}` : eventForm.maps_url.trim())
            : (eventForm.location_name?.trim() || eventForm.location || '');
          const eventPayload = {
            ...eventForm,
            location: locationCombined
          };
          const res = await apiJson('/api/events', {
            method: 'POST',
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify(eventPayload)
          });
          if (res?.announcementSent > 0) {
            toast.success(`Agenda ditambahkan & disiarkan ke ${res.announcementSent} perangkat!`);
          } else {
            toast.success(res?.message || 'Agenda berhasil ditambahkan.');
          }
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
      },
      'Agenda belum dapat disimpan.'
    ).finally(() => setIsSavingEvent(false));
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

  const toggleEventCarousel = (event) => withToast(
    async () => {
      await apiJson(`/api/events/${encodeURIComponent(event.id)}`, {
        method: 'PUT',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...toEventForm(event),
          show_in_carousel: !event.showInCarousel
        })
      });
      await loadDashboard();
    },
    'Status carousel agenda gagal diubah.',
    event.showInCarousel ? 'Agenda dikeluarkan dari carousel.' : 'Agenda masuk ke carousel.'
  );

  const deleteEvent = (event) => {
    if (!window.confirm(`Hapus agenda “${event.title}”?`)) return undefined;
    return withToast(
      async () => {
        await apiJson(`/api/events/${encodeURIComponent(event.id)}`, { method: 'DELETE', headers });
        await loadDashboard();
      },
      'Agenda belum dapat dihapus.',
      'Agenda berhasil dihapus.'
    );
  };

  const handleExportFull = () => withToastSync(
    () => import('@lib/excelExport').then((m) => m.exportFullReportToExcel({ users, transactions, books, events, stats })),
    'Gagal mengekspor laporan.',
    (res) => `Laporan lengkap berhasil diunduh (${res.fileName})`
  );

  if (!isValidTabSlug(tabParam)) {
    return <Navigate to="/admin/beranda" replace />;
  }

  if (loadingDashboard && !stats) {
    return (
      <div className="min-h-screen bg-cream-50 text-ink-900">
        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto min-w-0">
          <AdminSkeleton />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-50 text-ink-900">
      <main className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto min-w-0">
        {error && (
          <div role="alert" className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-semantic-danger/30 bg-semantic-dangerLight px-4 py-3 text-body font-medium text-semantic-danger">
            <span>{error}</span>
            <button type="button" onClick={loadDashboard} className="min-h-6 rounded-xl border border-semantic-danger/40 bg-cream-50 px-3 py-1.5 text-small font-bold text-semantic-danger transition hover:bg-semantic-dangerLight">
              Coba muat ulang
            </button>
          </div>
        )}

        {activeTab === 'overview' && (
          <OverviewTab
            stats={stats}
            books={books}
            users={users}
            transactions={transactions}
            onExportFull={handleExportFull}
          />
        )}

        {activeTab === 'books' && (
          <BooksTab
            books={books}
            onAddBook={() => setIsBookModalOpen(true)}
            onEditBook={startEditBook}
            onDeleteBook={deleteBook}
          />
        )}

        {activeTab === 'users' && (
          <UsersTab
            users={users}
            onUpdateRole={(id, nextRole) =>
              updateUser(id, { role: nextRole }, 'Role pengguna diperbarui.')
            }
          />
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
          editingBookId={editingBookId}
          onClose={() => {
            setIsBookModalOpen(false);
            setEditingBookId(null);
            setBookForm(EMPTY_BOOK_FORM);
          }}
          bookForm={bookForm}
          setBookForm={setBookForm}
          onSubmit={submitBook}
          isSavingBook={isSavingBook}
        />
      )}
    </div>
  );
};
