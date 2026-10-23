import test from 'node:test';
import assert from 'node:assert/strict';
import { getTextScale, setTextScale, TEXT_SCALE_OPTIONS } from '../src/lib/textSize.js';

test('Mode Teks Besar: opsi skala memuat normal, large, dan xlarge', () => {
  const ids = TEXT_SCALE_OPTIONS.map(o => o.id);
  assert.deepEqual(ids, ['normal', 'large', 'xlarge']);
});

test('Mode Teks Besar: fallback skala tidak valid ke normal', () => {
  const result = setTextScale('invalid_scale');
  assert.equal(result, 'normal');
});

test('Mode Teks Besar: set skala valid mengembalikan skala yang dipilih', () => {
  assert.equal(setTextScale('large'), 'large');
  assert.equal(setTextScale('xlarge'), 'xlarge');
  assert.equal(setTextScale('normal'), 'normal');
});
