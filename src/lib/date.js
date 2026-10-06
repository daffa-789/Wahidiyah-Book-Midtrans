const WIB_TIME_ZONE = 'Asia/Jakarta';

const YMD_FORMATTER = new Intl.DateTimeFormat('en-CA', {
  timeZone: WIB_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export const MONTH_NAMES = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

export const DAY_NAMES = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Ahd'];

export const formatYMD = (year, monthIndex, day) => {
  const mm = String(monthIndex + 1).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
};

export const todayWib = () => YMD_FORMATTER.format(new Date());

export const getTodayStr = todayWib;

export const formatWIB = (dateInput, { withTime = true, withSeconds = false } = {}) => {
  if (!dateInput) return '-';
  try {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (Number.isNaN(date.getTime())) return '-';

    const options = {
      timeZone: WIB_TIME_ZONE,
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    };
    if (withTime) {
      options.hour = '2-digit';
      options.minute = '2-digit';
      if (withSeconds) options.second = '2-digit';
    }
    return date.toLocaleString('id-ID', options);
  } catch {
    return String(dateInput);
  }
};

export const parseYMD = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value;
  const str = String(value).slice(0, 10);
  const match = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const [, y, m, d] = match.map(Number);
    return new Date(y, m - 1, d, 12, 0, 0);
  }
  const fallback = new Date(value);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
};

export const dateLabel = (value) => {
  if (!value) return '—';
  const date = parseYMD(value);
  if (!date || Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const fullDateLabel = (value) => {
  if (!value) return '—';
  const date = parseYMD(value);
  if (!date || Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

export const getCalendarMonthGrid = (year, monthIndex) => {
  const todayStr = todayWib();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const firstDayIndex = (new Date(year, monthIndex, 1).getDay() + 6) % 7;
  const prevMonthDaysCount = new Date(year, monthIndex, 0).getDate();

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
