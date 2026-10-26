/**
 * Sanitizer HTML ringan & aman untuk penampil naskah bacaan (XSS Defense-in-Depth).
 */

const DANGEROUS_BLOCK_TAGS = [
  'script',
  'style',
  'iframe',
  'object',
  'embed',
  'applet',
  'form',
  'svg',
  'math'
];

const DANGEROUS_TAG_REGEX = new RegExp(
  `<(?:${DANGEROUS_BLOCK_TAGS.join('|')})\\b[\\s\\S]*?<\\/(?:${DANGEROUS_BLOCK_TAGS.join('|')})>`,
  'gi'
);

const DANGEROUS_SELF_CLOSING_REGEX = /<\/?(?:script|style|iframe|object|embed|applet|form|input|button|textarea|select|option|link|meta|base|svg|math)[^>]*>/gi;

const ON_EVENT_REGEX = /\s+on[a-zA-Z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi;

const JAVASCRIPT_URL_REGEX = /\s+(?:href|src|action)\s*=\s*(?:"\s*(?:javascript|vbscript):[^"]*"|'\s*(?:javascript|vbscript):[^']*'|(?:javascript|vbscript):[^\s>]+)/gi;

const CSS_EXPRESSION_REGEX = /style\s*=\s*(?:"[^"]*expression\([^"]*"|'[^']*expression\([^']*')/gi;

function stripNestedTags(html) {
  let prev = '';
  let current = html;
  while (prev !== current) {
    prev = current;
    current = current.replace(DANGEROUS_TAG_REGEX, '');
    current = current.replace(DANGEROUS_SELF_CLOSING_REGEX, '');
  }
  return current;
}

export function sanitizeHtml(rawHtml) {
  if (typeof rawHtml !== 'string') return '';
  if (!rawHtml.trim()) return '';

  let cleaned = stripNestedTags(rawHtml);
  cleaned = cleaned.replace(ON_EVENT_REGEX, '');
  cleaned = cleaned.replace(JAVASCRIPT_URL_REGEX, '');
  cleaned = cleaned.replace(CSS_EXPRESSION_REGEX, '');
  cleaned = cleaned.replace(/<([a-zA-Z0-9]+)\s+>/g, '<$1>');
  cleaned = cleaned.replace(/<([a-zA-Z0-9]+)\s+([^>]*?)\s+(\/?)>/g, '<$1 $2$3>');
  return cleaned.trim();
}
