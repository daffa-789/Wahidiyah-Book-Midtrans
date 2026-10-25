import { getMapUrl, getDisplayLocation } from '@lib/maps';


import { useEffect, useMemo, useState } from 'react';
import {
  BellRing,
  Calendar,
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileSpreadsheet,
  Images,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  Send,
  Trash2,
  X
} from 'lucide-react';
// R56 — `exportEventsToExcel` TIDAK lagi di-import statis di sini. Import statis
// di berkas ini membuat Rollup mengangkat seluruh chunk `excel` (283 KB) ke
// dalam bundle AdminDashboard, sehingga setiap admin yang membuka dashboard
// ikut mengunduhnya. Sekarang di-`await import()` di dalam handler ekspor.
// R57 — `toast` dari sonner juga sudah tidak dipakai di sini; pelaporan
// galat kini terpusat lewat `withToast`/`withToastSync`.
import { apiJson, authHeaders, getStoredSession } from '@lib/api';
import { withToast, withToastSync } from '@lib/withToast';
import {
  MONTH_NAMES,
  DAY_NAMES,
  getTodayStr,
  dateLabel,
  fullDateLabel,
  getCalendarMonthGrid
} from '@lib/date';
import { layout, typography, surfaces, controls } from '@lib/styles';
import { Field } from '@ui/Field';

// Keempat kategori sengaja memakai gaya yang sama; disimpan sebagai satu konstanta
// agar tidak ada objek duplikat yang bisa berbeda diam-diam.
const EVENT_CATEGORIES = ['Mujahadah', 'Pengajian', 'Kubro', 'Peringatan'];

const CATEGORY_STYLE = {
  badge: 'bg-brand-50 text-brand-800 border-brand-200',
  dot: 'bg-brand-600',
  border: 'border-brand-200'
};

export const EventsTab = ({
  events,
  eventForm,
  setEventForm,
  isSavingEvent,
  submitEvent,
  deleteEvent,
  currentCalDate,
  setCurrentCalDate,
  selectedCalDate,
  setSelectedCalDate,
  agendaFilter,
  setAgendaFilter,
  editingEventId,
  editEvent,
  cancelEditEvent,
  toggleEventCarousel
}) => {
  const [pushStatus, setPushStatus] = useState({ enabled: false, subscribers: 0 });
  const [sendingId, setSendingId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    apiJson('/api/notifications/status')
      .then((data) => { if (!cancelled) setPushStatus(data); })
      .catch(() => { /* status opsional — jangan ganggu tampilan agenda */ });
    return () => { cancelled = true; };
  }, []);

  const sendReminder = (eventId) => {
    setSendingId(eventId);
    return withToast(
      () => apiJson(`/api/events/${eventId}/send-reminder`, {
        method: 'POST',
        headers: authHeaders(getStoredSession()?.token)
      }),
      'Pengumuman gagal disiarkan.',
      (result) => result.message || `Pengumuman terkirim ke ${result.sent} perangkat.`
    ).finally(() => setSendingId(null));
  };
  const calYear = currentCalDate.getFullYear();
  const calMonth = currentCalDate.getMonth();

  const prevCalMonth = () => {
    setCurrentCalDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const nextCalMonth = () => {
    setCurrentCalDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const goToTodayCal = () => {
    const now = new Date();
    setCurrentCalDate(now);
    const today = getTodayStr();
    setSelectedCalDate(today);
    setEventForm((prev) => ({ ...prev, event_date: today }));
  };

  const onSelectDate = (ymd) => {
    if (!ymd) return;
    setSelectedCalDate(ymd);
    setEventForm((prev) => ({ ...prev, event_date: ymd }));
  };

  const handleEventDateChange = (val) => {
    setEventForm((prev) => ({ ...prev, event_date: val }));
    if (val && !Number.isNaN(new Date(val).getTime())) {
      setSelectedCalDate(val);
      const d = new Date(val);
      setCurrentCalDate(new Date(d.getFullYear(), d.getMonth(), 1));
    }
  };

  const calendarGrid = useMemo(() => {
    return getCalendarMonthGrid(calYear, calMonth);
  }, [calYear, calMonth]);

  const eventsByDate = useMemo(() => {
    const map = new Map();
    events.forEach((evt) => {

      const d = String(evt.date || '').slice(0, 10);
      if (!d) return;
      if (!map.has(d)) map.set(d, []);
      map.get(d).push(evt);
    });
    return map;
  }, [events]);

  const selectedDateEvents = useMemo(() => {
    return eventsByDate.get(selectedCalDate) || [];
  }, [eventsByDate, selectedCalDate]);

  const filteredAllEvents = useMemo(() => {
    return events.filter((e) => {
      if (agendaFilter === 'Semua') return true;
      return e.category === agendaFilter;
    });
  }, [events, agendaFilter]);

  const jumpToEventDate = (evt) => {
    const dStr = String(evt.date || '').slice(0, 10);
    if (!dStr) return;
    const d = new Date(dStr);
    if (!Number.isNaN(d.getTime())) {
      setCurrentCalDate(new Date(d.getFullYear(), d.getMonth(), 1));
      setSelectedCalDate(dStr);
      setEventForm((prev) => ({ ...prev, event_date: dStr }));
    }
  };

  const handleExportEvents = () => withToastSync(
    () => import('@lib/excelExport').then((m) => m.exportEventsToExcel(events)),
    'Gagal mengekspor data agenda.',
    (res) => `${res.count} data agenda berhasil diekspor (${res.fileName})`
  );

  return (
    <section className="space-y-6">

              <div className="flex items-center justify-end pb-1">
                <button
                  type="button"
                  onClick={handleExportEvents}
                  className="inline-flex items-center gap-2 rounded-2xl border border-cream-300 bg-cream-50 px-4 py-2.5 text-caption font-bold text-ink-700 shadow-sm transition hover:bg-cream-100 cursor-pointer"
                  title="Ekspor seluruh daftar agenda ke Excel"
                >
                  <FileSpreadsheet className="h-4 w-4 text-brand-700" />
                  Export Laporan Lengkap (.xlsx)
                </button>
              </div>

              <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(340px,0.8fr)] items-start">

                <div className="space-y-5">

                  <div className={surfaces.panel}>

                    <div
                      className={`mb-4 flex items-start gap-2.5 rounded-2xl border px-3.5 py-3 ${
                        pushStatus.enabled
                          ? 'border-brand-200 bg-brand-50'
                          : 'border-semantic-warning/30 bg-semantic-warningLight'
                      }`}
                    >
                      <BellRing
                        className={`mt-0.5 h-4 w-4 shrink-0 ${pushStatus.enabled ? 'text-brand-700' : 'text-semantic-warning'}`}
                      />
                      <div className="min-w-0 text-caption leading-relaxed">
                        {pushStatus.enabled ? (
                          <>
                            <p className="font-bold text-brand-900">
                              Notifikasi Pengumuman &amp; Pengingat Mujahadah Aktif
                            </p>
                            <p className="text-brand-800">
                              {pushStatus.subscribers > 0
                                ? `${pushStatus.subscribers} perangkat terhubung. Pengumuman otomatis disiarkan saat agenda dibuat atau lewat tombol kirim.`
                                : 'Belum ada perangkat yang mengaktifkan. Ajak jemaah menekan tombol "Aktifkan notifikasi" di menu Profil.'}
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="font-bold text-semantic-warning">Notifikasi pengingat belum aktif</p>
                            <p className="text-semantic-warning/85">
                              Jalankan <code className="font-mono">node scripts/generate-vapid-keys.js</code>,
                              tempel hasilnya ke <code className="font-mono">.env</code>, lalu restart server.
                            </p>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-cream-200">
                      <div>
                        <h3 className="text-h3 font-black text-ink-900 tracking-tight flex items-center gap-2">
                          <Calendar className="h-5 w-5 text-brand-600" />
                          <span>{MONTH_NAMES[calMonth]} {calYear}</span>
                        </h3>
                      </div>

                      <div className={layout.rowStart} role="group" aria-label="Navigasi kalender agenda">
                        <button
                          type="button"
                          onClick={goToTodayCal}
                          className="px-3 py-1.5 rounded-xl bg-brand-50 text-brand-700 hover:bg-brand-100 text-caption font-bold transition cursor-pointer"
                        >
                          Hari Ini
                        </button>
                        <button
                          type="button"
                          onClick={prevCalMonth}
                          aria-label="Bulan sebelumnya"
                          className="p-2 rounded-xl border border-cream-300 text-ink-500 hover:bg-cream-100 transition cursor-pointer"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={nextCalMonth}
                          aria-label="Bulan selanjutnya"
                          className="p-2 rounded-xl border border-cream-300 text-ink-500 hover:bg-cream-100 transition cursor-pointer"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-7 gap-1 text-center mt-4 mb-2">
                      {DAY_NAMES.map((day, idx) => (
                        <div
                          key={day}
                          className={`text-caption font-bold py-1 ${idx === 4 ? 'text-brand-700' : 'text-ink-500'}`}
                        >
                          {day}
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1 text-center" data-testid="admin-calendar-grid">

                      {calendarGrid.leadingBlanks.map((item, idx) => (
                        <div
                          key={`blank-${idx}`}
                          aria-hidden="true"
                          className="h-14 sm:h-16 p-1 rounded-2xl border border-transparent text-ink-400 text-caption flex flex-col justify-start items-center select-none"
                        >
                          <span>{item.day}</span>
                        </div>
                      ))}

                      {calendarGrid.days.map((item) => {
                        const dayEvents = eventsByDate.get(item.ymd) || [];
                        const hasEvents = dayEvents.length > 0;
                        const isSelected = item.ymd === selectedCalDate;

                        return (
                          <button
                            key={item.ymd}
                            type="button"
                            onClick={() => onSelectDate(item.ymd)}
                            className={`h-14 sm:h-16 p-1 rounded-2xl border transition flex flex-col justify-between items-center cursor-pointer relative ${
                              isSelected
                                ? 'bg-brand-700 border-brand-800 text-cream-50 shadow-md shadow-brand-700/20'
                                : item.isToday
                                ? 'bg-brand-50/70 border-brand-300 text-brand-900 font-black'
                                : hasEvents
                                ? 'bg-cream-100/80 border-cream-300 hover:border-brand-300 text-ink-800'
                                : 'border-cream-200 hover:bg-cream-100 text-ink-700'
                            }`}
                          >
                            <span className={`text-caption font-extrabold mt-0.5 ${
                              isSelected ? 'text-cream-50' : item.isToday ? 'text-brand-700' : ''
                            }`}>
                              {item.day}
                            </span>

                            <div className="w-full flex items-center justify-center gap-1 mb-1">
                              {hasEvents && (
                                <div className="flex items-center gap-0.5">
                                  {dayEvents.slice(0, 3).map((evt, eIdx) => {
                                    return (
                                      <span
                                        key={eIdx}
                                        className={`h-1.5 w-1.5 rounded-full ${isSelected ? 'bg-cream-50' : CATEGORY_STYLE.dot}`}
                                      />
                                    );
                                  })}
                                  {dayEvents.length > 3 && (
                                    <span className={`text-overline font-bold ${isSelected ? 'text-cream-50' : 'text-brand-700'}`}>
                                      +{dayEvents.length - 3}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    <div className="mt-4 pt-3 border-t border-cream-200 flex flex-wrap items-center justify-between text-caption text-ink-400 gap-2">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="font-semibold text-ink-500">Kategori:</span>
                        {EVENT_CATEGORIES.map((cat) => (
                          <span key={cat} className="flex items-center gap-1">
                            <span className={`h-2 w-2 rounded-full ${CATEGORY_STYLE.dot}`} />
                            {cat}
                          </span>
                        ))}
                      </div>
                      <span className="text-ink-500">Klik tanggal untuk memilih & menambah agenda</span>
                    </div>
                  </div>

                  <div className={surfaces.panel}>
                    <div className="flex items-center justify-between gap-3 pb-3 border-b border-cream-200">
                      <div>
                        <h4 className="font-bold text-ink-900 text-small">
                          Agenda pada {fullDateLabel(selectedCalDate)}
                        </h4>
                        <p className="text-caption text-ink-500">
                          {selectedDateEvents.length} agenda terjadwal
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setEventForm(prev => ({ ...prev, event_date: selectedCalDate }));
                        }}
                        className="inline-flex min-h-6 items-center text-caption font-bold text-brand-700 hover:text-brand-800 cursor-pointer"
                      >
                        + Tambah di tanggal ini
                      </button>
                    </div>

                    <div className="mt-4 space-y-3">
                      {selectedDateEvents.length > 0 ? (
                        selectedDateEvents.map((evt) => {
                          return (
                            <div
                              key={evt.id}
                              className="flex items-start justify-between gap-3 p-3.5 rounded-2xl border border-cream-200 bg-cream-100/50 hover:bg-cream-100 transition"
                            >
                              <div className="space-y-1 min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className={`px-2.5 py-0.5 rounded-full text-micro font-extrabold border ${CATEGORY_STYLE.badge}`}>
                                    {evt.category}
                                  </span>
                                  <h5 className="font-bold text-ink-900 text-small">{evt.title}</h5>
                                </div>
                                <div className="flex flex-wrap items-center gap-3 text-caption text-ink-400 pt-0.5">
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3.5 w-3.5 text-ink-300" />
                                    {evt.time}
                                  </span>
                                  {evt.location ? (
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="font-semibold text-ink-700">{getDisplayLocation(evt.location)}</span>
                                      {getMapUrl(evt.location) && (
                                        <a
                                          href={getMapUrl(evt.location)}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-brand-50 hover:bg-brand-100 border border-brand-200 text-brand-800 font-bold text-micro transition shadow-2xs"
                                          title="Buka rute presisi di Google Maps"
                                        >
                                          <MapPin className="h-3 w-3 text-brand-600" />
                                          Rute Maps
                                        </a>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-ink-400 italic">Lokasi belum ditentukan</span>
                                  )}
                                </div>
                                {evt.description && (
                                  <p className="text-caption text-ink-500 pt-1 italic">{evt.description}</p>
                                )}
                              </div>
                              <div className={layout.rowShrink}>
                                <button
                                  type="button"
                                  onClick={() => toggleEventCarousel(evt)}
                                  className={`p-2 rounded-xl border transition cursor-pointer ${
                                    evt.showInCarousel
                                      ? 'border-brand-300 bg-brand-50 text-brand-700'
                                      : 'border-cream-300 text-ink-400 hover:bg-cream-100'
                                  }`}
                                  title={evt.showInCarousel ? 'Keluarkan dari carousel' : 'Tampilkan di carousel'}
                                  aria-pressed={evt.showInCarousel}
                                >
                                  <Images className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => sendReminder(evt.id)}
                                  disabled={sendingId === evt.id || !pushStatus.enabled}
                                  className="p-2 rounded-xl border border-cream-300 text-ink-600 hover:bg-cream-100 transition shrink-0 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                                  title={
                                    pushStatus.enabled
                                      ? `Siarkan notifikasi pengumuman agenda ini ke ${pushStatus.subscribers} perangkat`
                                      : 'Notifikasi belum aktif — isi kunci VAPID di .env'
                                  }
                                >
                                  {sendingId === evt.id
                                    ? <Loader2 className="h-4 w-4 animate-spin" />
                                    : <Send className="h-4 w-4" />}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => editEvent(evt)}
                                  className="p-2 rounded-xl border border-cream-300 text-ink-600 hover:bg-cream-100 transition shrink-0 cursor-pointer"
                                  title="Ubah agenda ini"
                                >
                                  <Pencil className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => deleteEvent(evt)}
                                  className="p-2 rounded-xl border border-semantic-danger/30 text-semantic-danger hover:bg-semantic-dangerLight transition shrink-0 cursor-pointer"
                                  title="Hapus agenda ini"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center py-6 text-ink-500 text-caption">
                          Belum ada agenda pada tanggal {dateLabel(selectedCalDate)}.
                          <p className="mt-1 text-ink-400">
                            Isi formulir di samping untuk menambahkan kegiatan pada tanggal ini.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-5">

                  <form onSubmit={submitEvent} className={surfaces.panelSpaced}>
                    <div className="border-b border-cream-200 pb-3">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-bold text-ink-900 text-body flex items-center gap-2">
                          {editingEventId
                            ? <><Pencil className={controls.iconBrand} /> Ubah agenda</>
                            : <><Plus className={controls.iconBrand} /> Tambah agenda baru</>}
                        </h3>
                        {editingEventId && (
                          <button
                            type="button"
                            onClick={cancelEditEvent}
                            className="inline-flex items-center gap-1 text-caption font-bold text-ink-400 hover:text-ink-700 transition cursor-pointer"
                          >
                            <X className="h-3.5 w-3.5" /> Batal
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Field
                        id="evt-title"
                        label="Judul agenda *"
                        required
                        value={eventForm.title}
                        onChange={(e) => setEventForm((form) => ({ ...form, title: e.target.value }))}
                        placeholder="Contoh: Mujahadah Kubro Rojabiyah"
                      />

                      <Field
                        id="evt-event_date"
                        label="Tanggal kegiatan *"
                        type="date"
                        required
                        value={eventForm.event_date}
                        onChange={(e) => handleEventDateChange(e.target.value)}
                      />

                      <div className="grid grid-cols-2 gap-2">
                        <Field
                          id="evt-time_start"
                          label="Waktu mulai"
                          type="time"
                          value={eventForm.time_start}
                          onChange={(e) => setEventForm((form) => ({ ...form, time_start: e.target.value }))}
                        />
                        <Field
                          id="evt-time_end"
                          label="Waktu selesai"
                          type="time"
                          value={eventForm.time_end}
                          onChange={(e) => setEventForm((form) => ({ ...form, time_end: e.target.value }))}
                        />
                      </div>

                      <div className="space-y-3">
                        <Field
                          id="evt-location-name"
                          label="Nama tempat / gedung *"
                          required
                          value={eventForm.location_name ?? eventForm.location ?? ''}
                          onChange={(e) => setEventForm((form) => ({
                            ...form,
                            location_name: e.target.value,
                            location: form.maps_url?.trim()
                              ? `${e.target.value.trim()} | ${form.maps_url.trim()}`
                              : e.target.value
                          }))}
                          placeholder="Contoh: NEKA KEDIRI atau Ponpes Kedunglo"
                        />

                        <Field
                          id="evt-maps-url"
                          label="Tautan Google Maps / Koordinat (opsional)"
                          value={eventForm.maps_url ?? ''}
                          onChange={(e) => setEventForm((form) => ({
                            ...form,
                            maps_url: e.target.value,
                            location: e.target.value?.trim()
                              ? `${(form.location_name || '').trim()} | ${e.target.value.trim()}`
                              : (form.location_name || '')
                          }))}
                          placeholder="Contoh: https://maps.app.goo.gl/... atau koordinat GPS"
                        />
                      </div>

                      <Field
                        as="select"
                        id="evt-category"
                        label="Kategori kegiatan"
                        value={eventForm.category}
                        onChange={(e) => setEventForm((form) => ({ ...form, category: e.target.value }))}
                      >
                        {EVENT_CATEGORIES.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </Field>

                      <Field
                        id="evt-organizer"
                        label="Penyelenggara"
                        value={eventForm.organizer}
                        onChange={(e) => setEventForm((form) => ({ ...form, organizer: e.target.value }))}
                        placeholder="Contoh: DPP PSW"
                      />

                      <Field
                        as="textarea"
                        id="evt-description"
                        label="Keterangan (opsional)"
                        value={eventForm.description}
                        onChange={(e) => setEventForm((form) => ({ ...form, description: e.target.value }))}
                        placeholder="Catatan tambahan agenda..."
                        rows="2"
                      />

                      <label className="flex cursor-pointer items-start gap-2.5 rounded-2xl border border-cream-300 bg-cream-50 px-3 py-3">
                        <input
                          type="checkbox"
                          checked={Boolean(eventForm.show_in_carousel)}
                          onChange={(e) => setEventForm((form) => ({ ...form, show_in_carousel: e.target.checked }))}
                          className="mt-0.5 h-4 w-4 rounded border-cream-300 text-brand-700 focus:ring-brand-300"
                        />
                        <span>
                          <span className="flex items-center gap-1.5 text-caption font-bold text-ink-800">
                            <Images className="h-3.5 w-3.5 text-brand-700" />
                            Tampilkan di Carousel
                          </span>
                          <span className="mt-0.5 block text-caption text-ink-400">
                            Agenda ini otomatis muncul sebagai banner di beranda jemaah.
                          </span>
                        </span>
                      </label>

                      <label className="flex cursor-pointer items-start gap-2.5 rounded-2xl border border-cream-300 bg-cream-50 px-3 py-3">
                        <input
                          type="checkbox"
                          checked={eventForm.broadcast_notification ?? true}
                          onChange={(e) => setEventForm((form) => ({ ...form, broadcast_notification: e.target.checked }))}
                          className="mt-0.5 h-4 w-4 rounded border-cream-300 text-brand-700 focus:ring-brand-300"
                        />
                        <span>
                          <span className="flex items-center gap-1.5 text-caption font-bold text-ink-800">
                            <BellRing className="h-3.5 w-3.5 text-brand-700" />
                            Kirim Notifikasi Pengumuman ke Jemaah
                          </span>
                          <span className="mt-0.5 block text-caption text-ink-400">
                            Kirimkan push notification langsung ke HP/perangkat jemaah saat agenda ini disimpan.
                          </span>
                        </span>
                      </label>
                    </div>

                    <button
                      disabled={isSavingEvent}
                      className="w-full flex items-center justify-center gap-2 rounded-2xl bg-brand-700 px-4 py-3 text-caption font-bold text-cream-50 shadow-sm transition hover:bg-brand-800 disabled:opacity-60 cursor-pointer"
                    >
                      {isSavingEvent
                        ? <Loader2 className={controls.spinner} />
                        : (editingEventId ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />)}
                      {editingEventId ? 'Simpan perubahan agenda' : 'Simpan agenda ke kalender'}
                    </button>
                  </form>

                  <div className="rounded-3xl border border-cream-300 bg-cream-50 p-5 shadow-sm space-y-3">
                    <div className="flex items-center justify-between border-b border-cream-200 pb-3">
                      <h4 className="font-bold text-ink-900 text-small">Semua Agenda ({filteredAllEvents.length})</h4>
                      <select
                        aria-label="Saring agenda berdasarkan kategori"
                        value={agendaFilter}
                        onChange={(e) => setAgendaFilter(e.target.value)}
                        className="text-caption rounded-xl border border-cream-300 px-2 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-200 text-ink-500 font-semibold cursor-pointer"
                      >
                        <option value="Semua">Semua Kategori</option>
                        {EVENT_CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    <div className="max-h-72 overflow-y-auto space-y-2 pr-1 divide-y divide-cream-200">
                      {filteredAllEvents.length > 0 ? (
                        filteredAllEvents.map((evt) => (
                          <div
                            key={evt.id}
                            className="pt-2 flex items-center justify-between gap-3 text-caption"
                          >
                            <button
                              type="button"
                              onClick={() => jumpToEventDate(evt)}
                              className="text-left flex-1 min-w-0 hover:text-brand-700 cursor-pointer transition"
                              title="Lihat di kalender"
                            >
                              <p className="font-bold text-ink-800 truncate">{evt.title}</p>
                              <p className={typography.helperInline}>{dateLabel(evt.date)} • {evt.category}</p>
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteEvent(evt)}
                              className="p-1.5 rounded-lg text-semantic-danger hover:bg-semantic-dangerLight transition cursor-pointer"
                              title="Hapus"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))
                      ) : (
                        <p className="text-caption text-ink-500 py-4 text-center">Tidak ada agenda.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </section>
  );
};
