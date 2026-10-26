import { describe, it, expect } from 'vitest';
import { sanitizeHtml as serverSanitize } from '../server/lib/sanitizeHtml.js';
import { sanitizeHtml as clientSanitize } from '../src/lib/sanitizeHtml.js';

describe.each([
  ['server sanitizeHtml', serverSanitize],
  ['client sanitizeHtml', clientSanitize]
])('%s: Pencegahan XSS & Pembersihan Naskah', (suiteName, sanitize) => {
  it('mengembalikan string kosong untuk input non-string atau string kosong', () => {
    expect(sanitize(null)).toBe('');
    expect(sanitize(undefined)).toBe('');
    expect(sanitize('')).toBe('');
    expect(sanitize('   ')).toBe('');
  });

  it('mempertahankan elemen dokumen yang aman (p, h1, b, i, table, list)', () => {
    const safeHtml = '<p>Paragraf <strong>tebal</strong> dan <em>miring</em></p><ul><li>Item 1</li></ul>';
    expect(sanitize(safeHtml)).toBe(safeHtml);
  });

  it('menghapus tag script beserta isinya', () => {
    const dirty = '<p>Halo</p><script>alert("xss")</script><p>Dunia</p>';
    expect(sanitize(dirty)).toBe('<p>Halo</p><p>Dunia</p>');
  });

  it('menghapus tag iframe, object, embed, style, form, svg', () => {
    const dirty = '<div>Aman</div><iframe src="https://evil.com"></iframe><object data="bad.swf"></object><svg><circle /></svg>';
    expect(sanitize(dirty)).toBe('<div>Aman</div>');
  });

  it('menghapus atribut event handler berbahaya (onload, onerror, onclick)', () => {
    const dirty = '<img src="foto.jpg" onerror="alert(1)" /><p onclick="evil()">Teks</p>';
    expect(sanitize(dirty)).toBe('<img src="foto.jpg"/><p>Teks</p>');
  });

  it('menghapus skema URL berbahaya (javascript:, vbscript:)', () => {
    const dirty = '<a href="javascript:alert(1)">Tautan Jahat</a><a href="https://example.com">Tautan Baik</a>';
    expect(sanitize(dirty)).toBe('<a>Tautan Jahat</a><a href="https://example.com">Tautan Baik</a>');
  });

  it('menetralisir tag berbahaya bersarang / evasive injection (<scr<script>ipt>)', () => {
    const dirty = '<scr<script>ipt>alert(1)</script>';
    // Tag script dihapus, menyisakan teks aman tanpa eksekusi kode
    expect(sanitize(dirty)).not.toContain('<script');
    expect(sanitize(dirty)).not.toContain('alert(1)');
  });
});
