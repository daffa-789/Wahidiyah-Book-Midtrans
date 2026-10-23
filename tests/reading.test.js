import test from 'node:test';
import assert from 'node:assert/strict';

// Uji validasi input pembatas buku dan progres membaca (Tahap 8 Fitur)

test('validasi progres membaca: nomor halaman wajib integer positif', () => {
  const validateProgress = (page) => {
    const num = Number(page);
    return Number.isInteger(num) && num >= 1;
  };

  assert.equal(validateProgress(1), true);
  assert.equal(validateProgress(42), true);
  assert.equal(validateProgress('10'), true);
  assert.equal(validateProgress(0), false);
  assert.equal(validateProgress(-5), false);
  assert.equal(validateProgress('abc'), false);
  assert.equal(validateProgress(1.5), false);
});

test('validasi pembatas buku: catatan dipotong maksimal 200 karakter', () => {
  const cleanNote = (note) => {
    if (typeof note !== 'string') return null;
    return note.trim().slice(0, 200);
  };

  assert.equal(cleanNote('Catatan penting'), 'Catatan penting');
  assert.equal(cleanNote('   Spasi dibersihkan   '), 'Spasi dibersihkan');
  assert.equal(cleanNote(null), null);
  assert.equal(cleanNote(undefined), null);

  const longText = 'a'.repeat(300);
  const truncated = cleanNote(longText);
  assert.equal(truncated.length, 200);
});

test('sanitasi pencarian katalog: karakter PostgREST dibersihkan', () => {
  const sanitizeSearch = (search) => {
    if (!search || typeof search !== 'string') return '';
    return search.trim().replace(/[%_,()]/g, '');
  };

  assert.equal(sanitizeSearch('mujahadah'), 'mujahadah');
  assert.equal(sanitizeSearch('kitab%20_'), 'kitab20');
  assert.equal(sanitizeSearch('   shalawat, (wahidiyah)   '), 'shalawat wahidiyah');
  assert.equal(sanitizeSearch('   '), '');
});

test('filter katalog: kategori Semua tidak menyaring', () => {
  const books = [
    { id: '1', title: 'Kitab A', category: 'Tasawuf' },
    { id: '2', title: 'Kitab B', category: 'Ajaran' },
    { id: '3', title: 'Kitab C', category: 'Umum' }
  ];

  const filterCategory = (items, category) => {
    if (!category || category === 'Semua') return items;
    return items.filter(b => b.category === category);
  };

  assert.equal(filterCategory(books, 'Semua').length, 3);
  assert.equal(filterCategory(books, 'Tasawuf').length, 1);
  assert.equal(filterCategory(books, 'Tasawuf')[0].id, '1');
  assert.equal(filterCategory(books, 'Doa').length, 0);
});
