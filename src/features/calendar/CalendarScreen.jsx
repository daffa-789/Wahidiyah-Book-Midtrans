import { getMapUrl, getDisplayLocation } from '@lib/maps';
import { useState, useMemo, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin
} from 'lucide-react';
import { useApp } from '@context/AppContext';
import {
  MONTH_NAMES,
  DAY_NAMES,
  formatYMD,
  getTodayStr,
  getCalendarMonthGrid
} from '@lib/date';
import { layout, controls } from '@lib/styles';
import { CalendarSkeleton } from '@ui/Skeleton';

export const CalendarScreen = () => {
  const { events, loadingAgenda, agendaError, refreshEvents } = useApp();

  const todayStr = useMemo(() => getTodayStr(), []);
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => getTodayStr());
  const [activeFilter, setActiveFilter] = useState('Semua');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const prevMonth = useCallback(() => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }, []);

  const nextMonth = useCallback(() => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }, []);

  const goToToday = useCallback(() => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDate(getTodayStr());
  }, []);

  const { daysInMonth, firstDayIndex } = useMemo(() => getCalendarMonthGrid(year, month), [year, month]);

  const eventDatesSet = useMemo(() => new Set(events.map(e => e.date)), [events]);

  const selectedDateEvents = useMemo(() => {
    return events.filter(e => e.date === selectedDate);
  }, [events, selectedDate]);

  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      if (activeFilter === 'Semua') return true;
      if (activeFilter === 'Kubro') return e.category === 'Kubro';
      if (activeFilter === 'Mujahadah') return e.category === 'Mujahadah';
      if (activeFilter === 'Pengajian') return e.category === 'Pengajian' || e.category === 'Bimbingan';
      return true;
    });
  }, [events, activeFilter]);

  if (loadingAgenda) {
    return (
      <div className="min-h-[640px] flex flex-col justify-between bg-cream-50 page-transition pb-6 font-sans">
        <CalendarSkeleton />
      </div>
    );
  }

  return (
    <div className="min-h-[640px] flex flex-col justify-between bg-cream-50 page-transition pb-6 font-sans">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6">

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

          <div className="lg:col-span-5 space-y-4">
            <div className="bg-cream-50 rounded-3xl p-4 border border-cream-200 shadow-sm">

              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-h3 font-extrabold text-ink-800 flex items-center gap-1.5">
                    <span>{MONTH_NAMES[month]} {year}</span>
                  </h2>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={goToToday}
                    className="text-caption font-bold px-2.5 py-1 bg-brand-50 text-brand-800 hover:bg-brand-100 rounded-xl transition mr-1"
                  >
                    Hari Ini
                  </button>
                  <button
                    type="button"
                    aria-label="Bulan sebelumnya"
                    onClick={prevMonth}
                    className="p-1.5 rounded-xl border border-cream-300 text-ink-500 hover:bg-brand-50 hover:text-brand-800 transition"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="Bulan selanjutnya"
                    onClick={nextMonth}
                    className="p-1.5 rounded-xl border border-cream-300 text-ink-500 hover:bg-brand-50 hover:text-brand-800 transition"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center mb-1">
                {DAY_NAMES.map((day, idx) => (
                  <div
                    key={day}
                    className={`text-caption font-bold py-1 ${idx === 4 ? 'text-brand-800' : 'text-ink-500'}`}
                  >
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1 text-center" data-testid="calendar-grid">

                {Array.from({ length: firstDayIndex }).map((_, idx) => (
                  <div key={`empty-${idx}`} className="h-10 text-caption text-ink-300 p-1" />
                ))}

                {Array.from({ length: daysInMonth }).map((_, idx) => {
                  const dayNum = idx + 1;
                  const dateStr = formatYMD(year, month, dayNum);
                  const isSelected = selectedDate === dateStr;
                  const hasEvents = eventDatesSet.has(dateStr);
                  const isToday = dateStr === todayStr;

                  return (
                    <button
                      key={dayNum}
                      type="button"
                      data-testid={`calendar-day-${dayNum}`}
                      onClick={() => setSelectedDate(dateStr)}
                      className={`h-10 rounded-2xl flex flex-col items-center justify-center relative text-caption font-semibold transition-all duration-150 ${
                        isSelected
                          ? 'bg-brand-700 hover:bg-brand-700 text-cream-50 shadow-md shadow-brand-700/30 scale-105 z-10'
                          : isToday
                          ? 'bg-brand-50 text-brand-800 border border-brand-300'
                          : 'hover:bg-brand-50/70 text-ink-700'
                      }`}
                    >
                      <span>{dayNum}</span>

                      <div className="flex items-center gap-0.5 mt-0.5">
                        {hasEvents && (
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-cream-50' : 'bg-brand-500'}`}
                            title="Ada Jadwal Wahidiyah"
                          />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-center gap-4 mt-3 pt-3 border-t border-cream-200 text-micro text-ink-400">
                <div className={layout.rowStart}>
                  <span className="w-2 h-2 rounded-full bg-brand-500" />
                  <span>Agenda / Mujahadah Wahidiyah</span>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4">

            <div className="bg-cream-50 rounded-3xl p-4 border border-cream-200 shadow-sm space-y-3">
          <div className={layout.rowBetween}>
            <div>
              <span className="text-micro font-bold uppercase tracking-wider text-ink-500">
                Tanggal Terpilih
              </span>
              <h3 className="font-extrabold text-body text-ink-800">
                {new Date(selectedDate).toLocaleDateString('id-ID', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </h3>
              </div>
            </div>

            {selectedDateEvents.length > 0 ? (
              <div className="space-y-2">
                <div className="text-caption font-bold text-ink-500 flex items-center gap-1">
                  <CalendarIcon className={controls.iconSm} />
                  <span>Agenda Wahidiyah:</span>
                </div>
                {selectedDateEvents.map((evt) => (
                  <div
                    key={evt.id}
                    className="bg-brand-50/50 rounded-2xl p-3 border border-brand-100/80 space-y-1.5"
                  >
                    <div className={layout.rowBetween}>
                      <span className={`text-overline font-bold px-2 py-0.5 rounded-full border ${evt.badgeColor}`}>
                        {evt.category}
                      </span>
                      <span className="text-micro text-ink-400 font-medium flex items-center gap-1">
                        <Clock className={controls.iconXs} />
                        {evt.time}
                      </span>
                    </div>
                    <h4 className="font-bold text-caption text-ink-800">{evt.title}</h4>
                    <p className="text-caption text-ink-400 leading-relaxed">{evt.description}</p>
                    <div className="flex items-center justify-between pt-1 text-micro text-ink-500 border-t border-brand-100/50">
                      {evt.location ? (
                        <div className="flex items-center gap-2 flex-wrap min-w-0">
                          <span className="font-semibold text-ink-800 truncate" title={getDisplayLocation(evt.location)}>
                            {getDisplayLocation(evt.location)}
                          </span>
                          {getMapUrl(evt.location) && (
                            <a
                              href={getMapUrl(evt.location)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-brand-50 hover:bg-brand-100 border border-brand-200 text-brand-800 font-bold text-micro transition shadow-2xs shrink-0 cursor-pointer"
                              title="Buka rute di Google Maps"
                            >
                              <MapPin className="h-3 w-3 text-brand-600" />
                              <span>Rute Maps</span>
                            </a>
                          )}
                        </div>
                      ) : (
                        <span className="text-ink-400 italic">Lokasi belum ditentukan</span>
                      )}
                      <span className="font-medium text-brand-700">{evt.organizer}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-cream-100 rounded-2xl p-3 text-center border border-dashed border-cream-300">
                <p className="text-caption text-ink-500">Tidak ada agenda majelis khusus pada tanggal ini</p>
              </div>
            )}
          </div>

        <div className="space-y-2 pt-1">
          <div className={layout.rowBetween}>
            <h3 className="font-extrabold text-body text-ink-800">Agenda Besar Wahidiyah</h3>
            <span className="text-micro text-ink-500 font-medium">Semua Jadwal Resmi</span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-caption">
            {['Semua', 'Kubro', 'Mujahadah', 'Pengajian'].map((pill) => (
              <button
                key={pill}
                type="button"
                onClick={() => setActiveFilter(pill)}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition text-caption ${
                  activeFilter === pill
                    ? 'bg-brand-700 hover:bg-brand-700 text-cream-50 shadow-sm'
                    : 'bg-cream-50 text-ink-500 border border-cream-300 hover:bg-brand-50'
                }`}
              >
                {pill}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            {agendaError ? (
              <div className="rounded-2xl border border-dashed border-semantic-danger/40 bg-semantic-dangerLight p-6 text-center" role="alert">
                <p className="text-caption font-bold text-semantic-danger">Agenda gagal dimuat: {agendaError}</p>
                <button type="button" onClick={() => refreshEvents().catch(() => {})} className="mt-3 min-h-6 rounded-xl bg-brand-700 px-3.5 py-1.5 text-small font-bold text-cream-50 transition hover:bg-brand-800">Coba muat ulang</button>
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="bg-cream-100 rounded-2xl p-6 text-center border border-dashed border-cream-300">
                <p className="text-caption text-ink-500 font-medium">Belum ada agenda atau jadwal majelis yang terdaftar</p>
              </div>
            ) : (
              filteredEvents.map((evt) => (
                <div
                  key={evt.id}
                  onClick={() => setSelectedDate(evt.date)}
                  className="bg-cream-50 hover:bg-brand-50/30 cursor-pointer rounded-2xl p-3 border border-cream-200 shadow-sm transition space-y-1.5"
                >
                  <div className={layout.rowBetween}>
                    <span className={`text-overline font-bold px-2 py-0.5 rounded-full border ${evt.badgeColor}`}>
                      {evt.category}
                    </span>
                    <span className="text-micro font-bold text-brand-800 bg-brand-50 px-2 py-0.5 rounded-lg border border-brand-100">
                      {new Date(evt.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <h4 className="font-bold text-caption text-ink-800 leading-snug">{evt.title}</h4>
                  <div className="flex items-center justify-between text-micro text-ink-400">
                    {evt.location ? (
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-ink-700 truncate">{getDisplayLocation(evt.location)}</span>
                        {getMapUrl(evt.location) && (
                          <a
                            href={getMapUrl(evt.location)}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-50 hover:bg-brand-100 border border-brand-200 text-brand-800 font-bold text-micro transition shrink-0 cursor-pointer"
                            title="Buka rute di Google Maps"
                          >
                            <MapPin className="h-2.5 w-2.5 text-brand-600" />
                            <span>Rute Maps</span>
                          </a>
                        )}
                      </div>
                    ) : (
                      <span className="text-ink-400 italic">Lokasi belum ditentukan</span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className={controls.iconXs} />
                      {evt.time}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
          </div>
        </div>

      </div>
    </div>
  );
};
