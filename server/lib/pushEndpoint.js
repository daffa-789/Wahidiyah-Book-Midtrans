const MAX_ENDPOINT_LENGTH = 1000;
const PUSH_SERVICE_HOSTS = new Set([
  'fcm.googleapis.com',
  'push.services.mozilla.com',
  'updates.push.services.mozilla.com',
  'web.push.apple.com'
]);

const isSupportedPushHost = (hostname) =>
  PUSH_SERVICE_HOSTS.has(hostname) || hostname.endsWith('.notify.windows.com');

export const isAllowedPushEndpoint = (value) => {
  if (typeof value !== 'string' || value.length > MAX_ENDPOINT_LENGTH) return false;

  try {
    const url = new URL(value);
    return url.protocol === 'https:' &&
      (!url.port || url.port === '443') &&
      !url.username &&
      !url.password &&
      isSupportedPushHost(url.hostname.toLowerCase());
  } catch {
    return false;
  }
};
