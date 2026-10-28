import { describe, expect, it } from 'vitest';
import { isAllowedPushEndpoint } from '../server/lib/pushEndpoint.js';

describe('isAllowedPushEndpoint', () => {
  it.each([
    'https://fcm.googleapis.com/fcm/send/example-token',
    'https://updates.push.services.mozilla.com/wpush/v2/example-token',
    'https://web.push.apple.com/QWxhZGRpbjpvcGVuIHNlc2FtZQ',
    'https://wns2-example.notify.windows.com/w/?token=example'
  ])('accepts a supported push service URL: %s', (endpoint) => {
    expect(isAllowedPushEndpoint(endpoint)).toBe(true);
  });

  it.each([
    'http://fcm.googleapis.com/fcm/send/token',
    'https://localhost/internal',
    'https://127.0.0.1/internal',
    'https://fcm.googleapis.com.evil.test/send/token',
    'https://fcm.googleapis.com:8443/send/token',
    'https://user:pass@fcm.googleapis.com/send/token',
    'not a URL'
  ])('rejects an unsupported or unsafe URL: %s', (endpoint) => {
    expect(isAllowedPushEndpoint(endpoint)).toBe(false);
  });
});
