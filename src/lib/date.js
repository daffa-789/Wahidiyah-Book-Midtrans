import dayjs from 'dayjs';
import 'dayjs/locale/id';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale('id');

const WIB_TIME_ZONE = 'Asia/Jakarta';

export const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const DAY_NAMES = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Ahd'];

export const formatYMD = (year, monthIndex, day) => {
  return dayjs(new Date(year, monthIndex, day)).format('YYYY-MM-DD');
};

export const todayWib = () => dayjs().tz(WIB_TIME_ZONE).format('YYYY-MM-DD');
export const getTodayStr = todayWib;

export const formatWIB = (dateInput, { withTime = true, withSeconds = false } = {}) => {
  if (!dateInput) return '-';
  const d = dayjs(dateInput).tz(WIB_TIME_ZONE);
  if (!d.isValid()) return '-';
  if (!withTime) return d.format('DD MMM YYYY');
  return d.format(withSeconds ? 'DD MMM YYYY, HH.mm.ss' : 'DD MMM YYYY, HH.mm');
};

export const parseYMD = (value) => {
  if (!value) return null;
  const d = dayjs(value);
  return d.isValid() ? d.toDate() : null;
};

export const dateLabel = (value) => {
  if (!value) return '—';
  const d = dayjs(value).tz(WIB_TIME_ZONE);
  return d.isValid() ? d.format('DD MMM YYYY') : '—';
};

export const fullDateLabel = (value) => {
  if (!value) return '—';
  const d = dayjs(value).tz(WIB_TIME_ZONE);
  return d.isValid() ? d.format('dddd, D MMMM YYYY') : '—';
};

export const getCalendarMonthGrid = (year, monthIndex) => {
  const todayStr = todayWib();
  const base = dayjs(new Date(year, monthIndex, 1));
  const daysInMonth = base.daysInMonth();
  const firstDayIndex = (base.day() + 6) % 7;
  const prevMonthDaysCount = dayjs(new Date(year, monthIndex, 0)).date();

  const leadingBlanks = [];
  for (let i = firstDayIndex - 1; i >= 0; i -= 1) {
    leadingBlanks.push({ day: prevMonthDaysCount - i, isCurrentMonth: false, ymd: null });
  }

  const days = [];
  for (let d = 1; d <= daysInMonth; d += 1) {
    const ymd = formatYMD(year, monthIndex, d);
    days.push({ day: d, isCurrentMonth: true, ymd, isToday: ymd === todayStr });
  }

  return { daysInMonth, firstDayIndex, leadingBlanks, days };
};

