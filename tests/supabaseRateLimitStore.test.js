import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({ rpc: vi.fn() }));

vi.mock('../server/db.js', () => ({
  supabaseServer: { rpc: h.rpc }
}));

import { SupabaseRateLimitStore } from '../server/lib/supabaseRateLimitStore.js';

describe('SupabaseRateLimitStore', () => {
  beforeEach(() => {
    vi.stubEnv('SUPABASE_SECRET_KEY', 'stable-test-secret');
    h.rpc.mockReset();
  });

  afterEach(() => vi.unstubAllEnvs());

  it('increments a pseudonymous key in the configured shared time window', async () => {
    h.rpc.mockResolvedValue({
      data: [{ total_hits: 4, reset_time: '2026-10-28T12:15:00.000Z' }],
      error: null
    });
    const store = new SupabaseRateLimitStore({ namespace: 'auth-ip' });
    store.init({ windowMs: 15 * 60 * 1000 });

    const result = await store.increment('203.0.113.4');

    expect(result.totalHits).toBe(4);
    expect(result.resetTime).toEqual(new Date('2026-10-28T12:15:00.000Z'));
    expect(h.rpc).toHaveBeenCalledWith('increment_api_rate_limit', {
      p_bucket_key: expect.stringMatching(/^[a-f0-9]{64}$/),
      p_window_ms: 15 * 60 * 1000
    });
    expect(JSON.stringify(h.rpc.mock.calls)).not.toContain('203.0.113.4');
  });

  it('uses independent hashes for separate limiter namespaces', async () => {
    h.rpc.mockResolvedValue({
      data: [{ total_hits: 1, reset_time: '2026-10-28T12:15:00.000Z' }],
      error: null
    });
    await new SupabaseRateLimitStore({ namespace: 'auth-ip' }).increment('key');
    await new SupabaseRateLimitStore({ namespace: 'payment' }).increment('key');

    const first = h.rpc.mock.calls[0][1].p_bucket_key;
    const second = h.rpc.mock.calls[1][1].p_bucket_key;
    expect(first).not.toBe(second);
  });

  it('fails closed when the shared store reports an error', async () => {
    h.rpc.mockResolvedValue({ data: null, error: new Error('database unavailable') });
    const store = new SupabaseRateLimitStore({ namespace: 'auth-ip' });

    await expect(store.increment('key')).rejects.toThrow('database unavailable');
  });

  it('delegates decrement and reset to their atomic database functions', async () => {
    h.rpc.mockResolvedValue({ data: null, error: null });
    const store = new SupabaseRateLimitStore({ namespace: 'auth-ip' });
    store.init({ windowMs: 60_000 });

    await store.decrement('key');
    await store.resetKey('key');

    expect(h.rpc.mock.calls.map(([name]) => name)).toEqual([
      'decrement_api_rate_limit',
      'reset_api_rate_limit'
    ]);
  });
});
