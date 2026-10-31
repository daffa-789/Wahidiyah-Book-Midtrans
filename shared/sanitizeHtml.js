/**
 * Sanitasi bersama untuk hasil konversi dokumen.
 * Browser memakai DOMPurify; lingkungan Node memakai filter kompatibilitas.
 */

import DOMPurify from 'dompurify';

const HTML_ONLY_PROFILE = Object.freeze({ USE_PROFILES: { html: true } });

const DANGEROUS_BLOCK_TAGS = [
  'script',
  'style',
  'iframe',
  'object',
  'embed',
  'applet',
  'form',
  'svg',
  'math',
];
const BLOCK_TAGS_PATTERN = DANGEROUS_BLOCK_TAGS.join('|');
const DANGEROUS_TAG_REGEX = new RegExp(
  '<(?:' + BLOCK_TAGS_PATTERN + ')\\b[\\s\\S]*?<\\/(?:' + BLOCK_TAGS_PATTERN + ')>',
  'gi',
);
const DANGEROUS_SELF_CLOSING_REGEX =
  /<\/?(?:script|style|iframe|object|embed|applet|form|input|button|textarea|select|option|link|meta|base|svg|math)[^>]*>/gi;
const ON_EVENT_REGEX = /\s+on[a-zA-Z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi;
const JAVASCRIPT_URL_REGEX =
  /\s+(?:href|src|action)\s*=\s*(?:"\s*(?:javascript|vbscript):[^"]*"|'\s*(?:javascript|vbscript):[^']*'|(?:javascript|vbscript):[^\s>]+)/gi;
const CSS_EXPRESSION_REGEX = /style\s*=\s*(?:"[^"]*expression\([^"]*"|'[^']*expression\([^']*')/gi;

function sanitizeForNode(html) {
  let previous;
  let cleaned = html;
  do {
    previous = cleaned;
    cleaned = cleaned.replace(DANGEROUS_TAG_REGEX, '').replace(DANGEROUS_SELF_CLOSING_REGEX, '');
  } while (cleaned !== previous);

  return cleaned
    .replace(ON_EVENT_REGEX, '')
    .replace(JAVASCRIPT_URL_REGEX, '')
    .replace(CSS_EXPRESSION_REGEX, '')
    .replace(/<([a-zA-Z0-9]+)\s+>/g, '<$1>')
    .replace(/<([a-zA-Z0-9]+)\s+([^>]*?)\s+(\/?)>/g, '<$1 $2$3>')
    .trim();
}

export function sanitizeHtml(rawHtml) {
  if (typeof rawHtml !== 'string' || !rawHtml.trim()) return '';
  if (typeof DOMPurify.sanitize === 'function') {
    return DOMPurify.sanitize(rawHtml, HTML_ONLY_PROFILE).trim();
  }
  return sanitizeForNode(rawHtml);
}
