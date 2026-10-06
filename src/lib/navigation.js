

export const normalizePath = (pathname) =>
  String(pathname || '/').toLowerCase().replace(/\/+$/, '') || '/';

export const SCREEN_TO_PATH = {
  home: '/',
  calendar: '/calendar',
  pro: '/pro',

  'profile-edit': '/profile',

  'subscription-history': '/riwayat',
  'help-center': '/help',
  about: '/about',
  'auth-success': '/auth/success',
  reader: '/reader',
  login: '/login',
  register: '/register',

  'verify-email': '/verify-email',
  'forgot-password': '/forgot-password',

  'auth-callback': '/auth/callback',

  'auth-success': '/auth/success',
  'payment-method': '/payment-method',
  'payment-confirm': '/payment-confirm',
  'payment-success': '/payment-success',
  'admin-dashboard': '/admin'
};

export const PATH_TO_SCREEN = {
  '/': 'home',
  '/home': 'home',
  '/calendar': 'calendar',
  '/reader': 'reader',
  '/pro': 'pro',
  '/pengaturan': 'profile-edit',
  '/profile': 'profile-edit',
  '/profile/edit': 'profile-edit',

  '/riwayat': 'subscription-history',
  '/profile/history': 'subscription-history',
  '/pengaturan/riwayat': 'subscription-history',
  '/pengaturan/history': 'subscription-history',
  '/help': 'help-center',
  '/help-center': 'help-center',
  '/about': 'about',
  '/login': 'login',
  '/register': 'register',

  '/verify-email': 'verify-email',
  '/forgot-password': 'forgot-password',

  '/auth/callback': 'auth-callback',

  '/auth/success': 'auth-success',
  '/payment-method': 'payment-method',
  '/payment-confirm': 'payment-confirm',
  '/payment-success': 'payment-success',
  '/admin': 'admin-dashboard',
  '/admin-dashboard': 'admin-dashboard',

  '/admin/ringkasan': 'admin-dashboard',
  '/admin/koleksi': 'admin-dashboard',
  '/admin/pengguna': 'admin-dashboard',
  '/admin/agenda': 'admin-dashboard',
  '/admin/carousel': 'admin-dashboard',
  '/admin/log': 'admin-dashboard'
};

export const ADMIN_DEFAULT_TAB = 'overview';

const ADMIN_PATH_TO_TAB = {
  '/admin': ADMIN_DEFAULT_TAB,
  '/admin-dashboard': ADMIN_DEFAULT_TAB,
  '/admin/ringkasan': 'overview',
  '/admin/koleksi': 'books',
  '/admin/pengguna': 'users',
  '/admin/agenda': 'events',
  '/admin/carousel': 'carousel',
  '/admin/log': 'logs'
};

export const tabIdFromPath = (pathname) =>
  ADMIN_PATH_TO_TAB[normalizePath(pathname)] || ADMIN_DEFAULT_TAB;

export const adminPathForTab = (tabId) =>
  Object.keys(ADMIN_PATH_TO_TAB).find(
    (path) => path.startsWith('/admin/') && ADMIN_PATH_TO_TAB[path] === tabId
  ) || '/admin';

export const ADMIN_TAB_SLUGS = new Set(
  Object.keys(ADMIN_PATH_TO_TAB)
    .filter((path) => path.startsWith('/admin/'))
    .map((path) => path.slice('/admin/'.length))
);

export const AUTH_ONLY_SCREENS = new Set([
  'login',
  'register',
  'verify-email',
  'forgot-password',

  'auth-callback',

  'auth-success'
]);

export const getScreenFromPath = () => {
  if (typeof window === 'undefined') return 'login';
  return PATH_TO_SCREEN[normalizePath(window.location.pathname)] || 'login';
};
