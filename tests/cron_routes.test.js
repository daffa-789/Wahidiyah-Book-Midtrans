import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  settleExpiredMembership: vi.fn(),
  sweepDueReminders: vi.fn(),
  logger: { info: vi.fn(), error: vi.fn() }
}));

vi.mock('../server/auth.js', () => ({ settleExpiredMembership: h.settleExpiredMembership }));
vi.mock('../server/lib/eventReminder.js', () => ({ sweepDueReminders: h.sweepDueReminders }));
vi.mock('../server/logger.js', () => ({ logger: h.logger }));

import { handleDailyMaintenance } from '../server/routes/cron_routes.js';

const makeResponse = () => ({
  statusCode: 200,
  headers: {},
  body: null,
  setHeader(name, value) { this.headers[name] = value; return this; },
  status(code) { this.statusCode = code; return this; },
  json(body) { this.body = body; return this; }
});

const makeRequest = (authorization) => ({
  get: vi.fn((name) => name.toLowerCase() === 'authorization' ? authorization : undefined)
});

beforeEach(() => {
  vi.stubEnv('CRON_SECRET', 'a-stable-test-secret-at-least-16');
  h.settleExpiredMembership.mockReset().mockResolvedValue(undefined);
  h.sweepDueReminders.mockReset().mockResolvedValue({ checked: 0, sent: 0, skipped: true });
  h.logger.info.mockReset();
  h.logger.error.mockReset();
});

afterEach(() => vi.unstubAllEnvs());

describe('daily maintenance cron route', () => {
  it('rejects requests without the configured bearer secret', async () => {
    const response = makeResponse();
    await handleDailyMaintenance(makeRequest(undefined), response);

    expect(response.statusCode).toBe(401);
    expect(response.headers['Cache-Control']).toBe('no-store');
    expect(h.sweepDueReminders).not.toHaveBeenCalled();
    expect(h.settleExpiredMembership).not.toHaveBeenCalled();
  });

  it('runs reminders and membership expiry for an authorized cron request', async () => {
    const response = makeResponse();
    await handleDailyMaintenance(makeRequest('Bearer a-stable-test-secret-at-least-16'), response);

    expect(response.statusCode).toBe(200);
    expect(response.body).toMatchObject({ success: true, memberships: 'checked' });
    expect(h.sweepDueReminders).toHaveBeenCalledOnce();
    expect(h.settleExpiredMembership).toHaveBeenCalledOnce();
  });

  it('returns a retryable failure when either maintenance task fails', async () => {
    h.settleExpiredMembership.mockRejectedValue(new Error('database unavailable'));
    const response = makeResponse();
    await handleDailyMaintenance(makeRequest('Bearer a-stable-test-secret-at-least-16'), response);

    expect(response.statusCode).toBe(500);
    expect(response.body).toEqual({ success: false, message: 'Pemeliharaan harian gagal.' });
    expect(h.logger.error).toHaveBeenCalledOnce();
  });
});
