

import { useMemo } from 'react';
import {
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
  Trash2,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import { exportEventsToExcel } from '@lib/excelExport';
import {
  MONTH_NAMES,
  DAY_NAMES,
  getTodayStr,
  dateLabel,
  fullDateLabel,
  getCalendarMonthGrid
} from '@lib/date';
import { typography } from '@lib/styles';

const CATEGORY_STYLES = {
  Mujahadah: {
    badge: 'bg-brand-50 text-brand-800 border-brand-200',
    dot: 'bg-brand-600',
    border: 'border-brand-200'
  },
  Pengajian: {
    badge: 'bg-sky-50 text-sky-800 border-sky-200',
    dot: 'bg-sky-500',
    border: 'border-sky-200'
  },
  Kubro: {
    badge: 'bg-purple-50 text-purple-800 border-purple-200',
    dot: 'bg-purple-500',
    border: 'border-purple-200'
  },
  Peringatan: {
    badge: 'bg-amber-50 text-amber-800 border-amber-200',
    dot: 'bg-amber-500',
    border: 'border-amber-200'
  }
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

  const handleExportEvents = () => {
    try {
      const res = exportEventsToExcel(events);
      toast.success(`${res.count} data agenda berhasil diekspor (${res.fileName})`);
    } catch (err) {
      toast.error(err.message || 'Gagal mengekspor data agenda.');
    }
  };

  return (
    <section className="space-y-6">

              <div className={layout.toolbarRow}>
                <div>
                  <h2 className={typography.sectionTitle}>Agenda &amp; kegiatan majelis</h2>
                  <p className={typography.helper}>
                    Jadwal pengajian dan mujahadah tersinkronisasi langsung ke kalender aplikasi dan database Supabase Cloud.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleExportEvents}
                    className="inline-flex items-center gap-2 rounded-2xl border border-cream-300 bg-white px-3.5 py-2 text-xs font-bold text-ink-700 shadow-sm transition hover:bg-cream-100"
                    title="Ekspor seluruh daftar agenda ke Excel"
                  >
                    <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                    Export Excel
                  </button>
                  <span className="inline-flex items-center gap-1.5 rounded-2xl bg-brand-50 border border-brand-200 px-3.5 py-2 text-xs font-bold text-brand-800">
                    <CalendarCheck className={controls.iconBrand} />
                    {events.length} Agenda Terdaftar
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-2xl bg-gold-50 border border-gold-200 px-3.5 py-2 text-xs font-bold text-gold-800">
                    <Images className="h-4 w-4 text-gold-600" />
                    {events.filter((evt) => evt.showInCarousel).length} di Carousel
                  </span>
                </div>
              </div>

              <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(340px,0.8fr)] items-start">

                <div className="space-y-5">

                  <div className={surfaces.panel}>

                    <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-cream-200">
                      <div>
                        <h3 className="text-lg font-black text-ink-900 tracking-tight flex items-center gap-2">
                          <Calendar className="h-5 w-5 text-brand-600" />
                          <span>{MONTH_NAMES[calMonth]} {calYear}</span>
                        </h3>
                      </div>

                      <div className={layout.rowStart} role="group" aria-label="Navigasi kalender agenda">
                        <button
                          type="button"
                          onClick={goToTodayCal}
                          className="px-3 py-1.5 rounded-xl bg-brand-50 text-brand-700 hover:bg-brand-100 text-xs font-bold transition cursor-pointer"
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
                          className={`text-xs font-bold py-1 ${idx === 4 ? 'text-brand-700' : 'text-ink-500'}`}
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
                          className="h-14 sm:h-16 p-1 rounded-2xl border border-transparent text-ink-400 text-xs flex flex-col justify-start items-center select-none"
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
                                ? 'bg-brand-700 border-brand-800 text-white shadow-md shadow-brand-700/20'
                                : item.isToday
                                ? 'bg-brand-50/70 border-brand-300 text-brand-900 font-black'
                                : hasEvents
                                ? 'bg-cream-100/80 border-cream-300 hover:border-brand-300 text-ink-800'
                                : 'border-cream-200 hover:bg-cream-100 text-ink-700'
                            }`}
                          >
                            <span className={`text-xs font-extrabold mt-0.5 ${
                              isSelected ? 'text-white' : item.isToday ? 'text-brand-700' : ''
                            }`}>
                              {item.day}
                            </span>

                            <div className="w-full flex items-center justify-center gap-1 mb-1">
                              {hasEvents && (
                                <div className="flex items-center gap-0.5">
                                  {dayEvents.slice(0, 3).map((evt, eIdx) => {
                                    const dotColor = CATEGORY_STYLES[evt.category]?.dot || 'bg-brand-600';
                                    return (
                                      <span
                                        key={eIdx}
                                        className={`h-1.5 w-1.5 rounded-full ${isSelected ? 'bg-cream-50' : dotColor}`}
                                      />
                                    );
                                  })}
                                  {dayEvents.length > 3 && (
                                    <span className={`text-overline font-bold ${isSelected ? 'text-white' : 'text-brand-700'}`}>
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
                        {Object.entries(CATEGORY_STYLES).map(([cat, style]) => (
                          <span key={cat} className="flex items-center gap-1">
                            <span className={`h-2 w-2 rounded-full ${style.dot}`} />
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
                        <h4 className="font-bold text-ink-900 text-sm">
                          Agenda pada {fullDateLabel(selectedCalDate)}
                        </h4>
                        <p className="text-xs text-ink-500">
                          {selectedDateEvents.length} agenda terjadwal
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setEventForm(prev => ({ ...prev, event_date: selectedCalDate }));
                        }}
                        className="inline-flex min-h-6 items-center text-xs font-bold text-brand-700 hover:text-brand-800 cursor-pointer"
                      >
                        + Tambah di tanggal ini
                      </button>
                    </div>

                    <div className="mt-4 space-y-3">
                      {selectedDateEvents.length > 0 ? (
                        selectedDateEvents.map((evt) => {
                          const catStyle = CATEGORY_STYLES[evt.category] || CATEGORY_STYLES.Mujahadah;
                          return (
                            <div
                              key={evt.id}
                              className="flex items-start justify-between gap-3 p-3.5 rounded-2xl border border-cream-200 bg-cream-100/50 hover:bg-cream-100 transition"
                            >
                              <div className="space-y-1 min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className={`px-2.5 py-0.5 rounded-full text-micro font-extrabold border ${catStyle.badge}`}>
                                    {evt.category}
                                  </span>
                                  <h5 className="font-bold text-ink-900 text-sm">{evt.title}</h5>
                                </div>
                                <div className="flex flex-wrap items-center gap-3 text-xs text-ink-400 pt-0.5">
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3.5 w-3.5 text-ink-300" />
                                    {evt.time}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <MapPin className="h-3.5 w-3.5 text-ink-300" />
                                    {evt.location}
                                  </span>
                                </div>
                                {evt.description && (
                                  <p className="text-xs text-ink-500 pt-1 italic">{evt.description}</p>
                                )}
                              </div>
                              <div className={layout.rowShrink}>
                                <button
                                  type="button"
                                  onClick={() => toggleEventCarousel(evt)}
                                  className={`p-2 rounded-xl border transition cursor-pointer ${
                                    evt.showInCarousel
                                      ? 'border-gold-300 bg-gold-50 text-gold-700'
                                      : 'border-cream-300 text-ink-400 hover:bg-cream-100'
                                  }`}
                                  title={evt.showInCarousel ? 'Keluarkan dari carousel' : 'Tampilkan di carousel'}
                                  aria-pressed={evt.showInCarousel}
                                >
                                  <Images className="h-4 w-4" />
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
                                  className="p-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 transition shrink-0 cursor-pointer"
                                  title="Hapus agenda ini"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center py-6 text-ink-500 text-xs">
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
                        <h3 className="font-bold text-ink-900 text-base flex items-center gap-2">
                          {editingEventId
                            ? <><Pencil className={controls.iconBrand} /> Ubah agenda</>
                            : <><Plus className={controls.iconBrand} /> Tambah agenda baru</>}
                        </h3>
                        {editingEventId && (
                          <button
                            type="button"
                            onClick={cancelEditEvent}
                            className="inline-flex items-center gap-1 text-xs font-bold text-ink-400 hover:text-ink-700 transition cursor-pointer"
                          >
                            <X className="h-3.5 w-3.5" /> Batal
                          </button>
                        )}
                      </div>
                      <p className={typography.metaTight}>
                        Jadwal otomatis tampil di kalender spiritual jemaah.
                      </p>
                    </div>

                    <div className="p-3 rounded-2xl bg-brand-50 border border-brand-200 text-xs text-brand-800 flex items-center justify-between">
                      <span className="font-semibold">
                        🗓️ Tanggal: {dateLabel(eventForm.event_date || selectedCalDate)}
                      </span>
                      <span className="text-micro text-brand-700 font-bold">Sinkron Kalender</span>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label htmlFor="evt-title" className={typography.fieldLabel}>Judul agenda *</label>
                        <input
                          required
                          id="evt-title"
                          value={eventForm.title}
                          onChange={(e) => setEventForm((form) => ({ ...form, title: e.target.value }))}
                          placeholder="Contoh: Mujahadah Kubro Rojabiyah"
                          className="w-full rounded-xl border border-cream-300 px-3 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-200 focus:border-brand-600"
                        />
                      </div>

                      <div>
                        <label htmlFor="evt-event_date" className={typography.fieldLabel}>Tanggal kegiatan *</label>
                        <input
                          required
                          type="date"
                          id="evt-event_date"
                          value={eventForm.event_date}
                          onChange={(e) => handleEventDateChange(e.target.value)}
                          className="w-full rounded-xl border border-cream-300 px-3 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-200 focus:border-brand-600"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label htmlFor="evt-time_start" className={typography.fieldLabel}>Waktu mulai</label>
                          <input
                            type="time"
                            id="evt-time_start"
                            value={eventForm.time_start}
                            onChange={(e) => setEventForm((form) => ({ ...form, time_start: e.target.value }))}
                            className="w-full rounded-xl border border-cream-300 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-200 focus:border-brand-600"
                          />
                        </div>
                        <div>
                          <label htmlFor="evt-time_end" className={typography.fieldLabel}>Waktu selesai</label>
                          <input
                            type="time"
                            id="evt-time_end"
                            value={eventForm.time_end}
                            onChange={(e) => setEventForm((form) => ({ ...form, time_end: e.target.value }))}
                            className="w-full rounded-xl border border-cream-300 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-200 focus:border-brand-600"
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="evt-location" className={typography.fieldLabel}>Lokasi kegiatan *</label>
                        <input
                          required
                          id="evt-location"
                          value={eventForm.location}
                          onChange={(e) => setEventForm((form) => ({ ...form, location: e.target.value }))}
                          placeholder="Contoh: Ponpes Kedunglo Kediri / Daring"
                          className="w-full rounded-xl border border-cream-300 px-3 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-200 focus:border-brand-600"
                        />
                      </div>

                      <div>
                        <label htmlFor="evt-category" className={typography.fieldLabel}>Kategori kegiatan</label>
                        <select
                          id="evt-category"
                          value={eventForm.category}
                          onChange={(e) => setEventForm((form) => ({ ...form, category: e.target.value }))}
                          className="w-full rounded-xl border border-cream-300 px-3 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-200 focus:border-brand-600"
                        >
                          {['Mujahadah', 'Pengajian', 'Kubro', 'Peringatan'].map((option) => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label htmlFor="evt-organizer" className={typography.fieldLabel}>Penyelenggara</label>
                        <input
                          id="evt-organizer"
                          value={eventForm.organizer}
                          onChange={(e) => setEventForm((form) => ({ ...form, organizer: e.target.value }))}
                          placeholder="Contoh: DPP PSW"
                          className="w-full rounded-xl border border-cream-300 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-200 focus:border-brand-600"
                        />
                      </div>

                      <div>
                        <label htmlFor="evt-description" className={typography.fieldLabel}>Keterangan (opsional)</label>
                        <textarea
                          id="evt-description"
                          value={eventForm.description}
                          onChange={(e) => setEventForm((form) => ({ ...form, description: e.target.value }))}
                          placeholder="Catatan tambahan agenda..."
                          rows="2"
                          className="w-full rounded-xl border border-cream-300 px-3 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-200 focus:border-brand-600"
                        />
                      </div>

                      <label className="flex cursor-pointer items-start gap-2.5 rounded-2xl border border-cream-300 bg-white px-3 py-3">
                        <input
                          type="checkbox"
                          checked={Boolean(eventForm.show_in_carousel)}
                          onChange={(e) => setEventForm((form) => ({ ...form, show_in_carousel: e.target.checked }))}
                          className="mt-0.5 h-4 w-4 rounded border-cream-300 text-brand-700 focus:ring-brand-300"
                        />
                        <span>
                          <span className="flex items-center gap-1.5 text-xs font-bold text-ink-800">
                            <Images className="h-3.5 w-3.5 text-gold-600" />
                            Tampilkan di Carousel
                          </span>
                          <span className="mt-0.5 block text-caption text-ink-400">
                            Agenda ini otomatis muncul sebagai banner di beranda jemaah.
                          </span>
                        </span>
                      </label>
                    </div>

                    <button
                      disabled={isSavingEvent}
                      className="w-full flex items-center justify-center gap-2 rounded-2xl bg-brand-700 px-4 py-3 text-xs font-bold text-white shadow-sm transition hover:bg-brand-800 disabled:opacity-60 cursor-pointer"
                    >
                      {isSavingEvent
                        ? <Loader2 className={controls.spinner} />
                        : (editingEventId ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />)}
                      {editingEventId ? 'Simpan perubahan agenda' : 'Simpan agenda ke kalender'}
                    </button>
                  </form>

                  <div className="rounded-3xl border border-cream-300 bg-cream-50 p-5 shadow-sm space-y-3">
                    <div className="flex items-center justify-between border-b border-cream-200 pb-3">
                      <h4 className="font-bold text-ink-900 text-sm">Semua Agenda ({filteredAllEvents.length})</h4>
                      <select
                        aria-label="Saring agenda berdasarkan kategori"
                        value={agendaFilter}
                        onChange={(e) => setAgendaFilter(e.target.value)}
                        className="text-xs rounded-xl border border-cream-300 px-2 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-200 text-ink-500 font-semibold cursor-pointer"
                      >
                        <option value="Semua">Semua Kategori</option>
                        <option value="Mujahadah">Mujahadah</option>
                        <option value="Pengajian">Pengajian</option>
                        <option value="Kubro">Kubro</option>
                        <option value="Peringatan">Peringatan</option>
                      </select>
                    </div>

                    <div className="max-h-72 overflow-y-auto space-y-2 pr-1 divide-y divide-cream-200">
                      {filteredAllEvents.length > 0 ? (
                        filteredAllEvents.map((evt) => (
                          <div
                            key={evt.id}
                            className="pt-2 flex items-center justify-between gap-3 text-xs"
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
                              className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition cursor-pointer"
                              title="Hapus"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-ink-500 py-4 text-center">Tidak ada agenda.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </section>
  );
};
