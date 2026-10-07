

import pc from 'picocolors';

export const color = pc;


const timeWIB = () =>
  new Date().toLocaleTimeString('id-ID', {
    timeZone: 'Asia/Jakarta',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

const LEVEL_STYLE = {
  INFO: color.cyan,
  OK: color.green,
  WARN: color.yellow,
  ERROR: color.red,
  REQ: color.blue,
  DATA: color.magenta
};

const emit = (level, scope, message, meta) => {
  const paint = LEVEL_STYLE[level] || color.white;
  const head = `${color.dim(timeWIB())} ${paint(level.padEnd(5))} ${color.bold(`[${scope}]`)}`;

  let line = `${head} ${message}`;
  if (meta && typeof meta === 'object') {
    const pairs = Object.entries(meta)
      .filter(([, v]) => v !== undefined && v !== null && v !== '')
      .map(([k, v]) => `${color.dim(k)}=${v}`);
    if (pairs.length) line += ` ${color.gray('(')}${pairs.join(' ')}${color.gray(')')}`;
  }
  console.log(line);
};

export const logger = {
  info: (scope, message, meta) => emit('INFO', scope, message, meta),
  ok: (scope, message, meta) => emit('OK', scope, message, meta),
  warn: (scope, message, meta) => emit('WARN', scope, message, meta),
  error: (scope, message, meta) => emit('ERROR', scope, message, meta),
  data: (scope, message, meta) => emit('DATA', scope, message, meta),

  color,

  request: ({ method, path, status, durationMs, ip }) => {
    const statusPaint = status >= 500 ? color.red : status >= 400 ? color.yellow : color.green;
    const slow = durationMs >= 1000 ? color.yellow(' (lambat)') : '';
    const line = [
      `${color.dim(timeWIB())} ${color.blue('REQ'.padEnd(5))} ${color.bold(`[HTTP]`)}`,
      color.bold(method.padEnd(6)),
      path,
      statusPaint(`→ ${status}`),
      color.gray(`${durationMs}ms`),
      ip ? color.dim(ip) : ''
    ].filter(Boolean).join(' ');
    console.log(line + slow);
  }
};

export const banner = (title, lines = []) => {
  const bar = color.gray('─'.repeat(Math.max(46, title.length + 4)));
  console.log('');
  console.log(`  ${color.bold(color.green(title))}`);
  if (lines.length) {
    console.log(`  ${bar}`);
    for (const l of lines) console.log(`  ${color.dim('•')} ${l}`);
  }
  console.log('');
};

export default logger;
