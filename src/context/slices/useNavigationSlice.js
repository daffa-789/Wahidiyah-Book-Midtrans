import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import {
  AUTH_ONLY_SCREENS,
  PATH_TO_SCREEN,
  SCREEN_TO_PATH,
  adminPathForTab,
  getScreenFromPath,
  normalizePath
} from '@lib/navigation';
import {
  clearIntendedLocation,
  peekIntendedLocation,
  saveIntendedLocation
} from '@lib/api';

export const useNavigationSlice = ({ initialScreen, userRole }) => {
  const [currentScreen, setCurrentScreen] = useState(() => initialScreen || getScreenFromPath());
  const [currentPath, setCurrentPath] = useState(() => {
    if (typeof window === 'undefined') return SCREEN_TO_PATH[initialScreen] || '/';
    return normalizePath(window.location.pathname);
  });

  const routerNavigatorRef = useRef(null);
  const screenRef = useRef(currentScreen);

  const setRouterNavigator = useCallback((nav) => {
    routerNavigatorRef.current = nav;
  }, []);

  const syncScreenFromPath = useCallback((pathname) => {
    const normalized = normalizePath(pathname);
    const nextScreen = PATH_TO_SCREEN[normalized] || (normalized === '/' ? 'home' : 'login');
    screenRef.current = nextScreen;
    setCurrentPath(normalized);
    setCurrentScreen(nextScreen);
  }, []);

  const rememberIntendedLocation = useCallback((pathname) => {
    const normalized = normalizePath(pathname);
    const screen = PATH_TO_SCREEN[normalized];
    if (!screen || AUTH_ONLY_SCREENS.has(screen)) return;
    if (!SCREEN_TO_PATH[screen]) return;
    saveIntendedLocation(screen);
  }, []);

  const consumeIntendedScreen = useCallback((role) => {
    const fallbackScreen = role === 'admin' ? 'admin-dashboard' : 'home';
    const intended = peekIntendedLocation();
    clearIntendedLocation();
    if (!intended) return fallbackScreen;

    const screen = Object.prototype.hasOwnProperty.call(SCREEN_TO_PATH, intended)
      ? intended
      : PATH_TO_SCREEN[normalizePath(intended)];

    if (!screen || AUTH_ONLY_SCREENS.has(screen)) return fallbackScreen;
    if (screen === 'admin-dashboard' && role !== 'admin') return fallbackScreen;
    if (role === 'admin' && screen !== 'admin-dashboard') return fallbackScreen;
    return screen;
  }, []);

  const applyRoleChange = useCallback((nextRole, { notify = false } = {}) => {
    const isAdmin = nextRole === 'admin';
    const screen = isAdmin ? 'admin-dashboard' : 'home';
    const path = SCREEN_TO_PATH[screen];
    screenRef.current = screen;
    setCurrentScreen(screen);
    setCurrentPath(path);
    routerNavigatorRef.current?.(path, { replace: true });
    if (notify) {
      toast.info(isAdmin
        ? 'Role akun Anda telah diubah menjadi Administrator.'
        : 'Role akun Anda telah diubah menjadi User.');
    }
  }, []);

  const navigateTo = useCallback((screen, { replace = false, currentRole, adminTab } = {}) => {
    let destScreen = screen;
    const effectiveRole = currentRole !== undefined ? currentRole : userRole;

    if (destScreen === 'admin-dashboard' && effectiveRole !== 'admin') {
      destScreen = 'home';
    }

    if (
      effectiveRole === 'admin' &&
      destScreen !== 'admin-dashboard' &&
      !AUTH_ONLY_SCREENS.has(destScreen)
    ) {
      destScreen = 'admin-dashboard';
    }

    if (!SCREEN_TO_PATH[destScreen]) {
      destScreen = 'home';
    }

    let targetPath = SCREEN_TO_PATH[destScreen];
    if (destScreen === 'admin-dashboard' && adminTab) {
      targetPath = adminPathForTab(adminTab);
    }

    const fromScreen = screenRef.current;
    const involvesReader = destScreen === 'reader' || fromScreen === 'reader';

    screenRef.current = destScreen;
    setCurrentScreen(destScreen);
    setCurrentPath(targetPath);

    if (routerNavigatorRef.current) {
      routerNavigatorRef.current(targetPath, { replace });
    } else if (typeof window !== 'undefined') {
      const historyMethod = replace ? 'replaceState' : 'pushState';
      if (window.location.pathname !== targetPath && window.history?.[historyMethod]) {
        window.history[historyMethod]({ screen: destScreen, path: targetPath }, '', targetPath);
      }
    }

    if (!involvesReader) {
      window.scrollTo?.({ top: 0, behavior: 'smooth' });
    }
  }, [userRole]);

  return {
    currentScreen,
    setCurrentScreen,
    currentPath,
    setCurrentPath,
    screenRef,
    routerNavigatorRef,
    setRouterNavigator,
    syncScreenFromPath,
    rememberIntendedLocation,
    consumeIntendedScreen,
    applyRoleChange,
    navigateTo
  };
};
