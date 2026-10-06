

const WIB_TIME_ZONE = 'Asia/Jakarta';


const DATE_FORMATTER = new Intl.DateTimeFormat('en-CA', {
  timeZone: WIB_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
});


export const todayWib = (date = new Date()) => DATE_FORMATTER.format(date);
