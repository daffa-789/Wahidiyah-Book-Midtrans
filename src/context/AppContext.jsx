import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { PAYMENT_METHODS } from '@data/mockData';
import {
  apiJson,
  authHeaders,
  clearIntendedLocation,
  clearLastPayment,
  clearPendingVerification,
  clearSession,
  getPendingVerification,
  getStoredLastPayment,
  getStoredSession,
  peekIntendedLocation,
  readableError,
  saveIntendedLocation,
  saveLastPayment,
  savePendingVerification,
  saveSession
} from '@lib/api';




import {
  AUTH_ONLY_SCREENS,
  PATH_TO_SCREEN,
  SCREEN_TO_PATH,
  adminPathForTab,
  getScreenFromPath,
  normalizePath
} from '@lib/navigation';
import {
  EMPTY_USER,
  normalizeBook,
  normalizeCarouselSlide,
  normalizeEvent,
  normalizeTransaction,
  normalizeUser,
  userSignature
} from '@lib/normalizers';

const AppContext = createContext(null);

/**
 * Satu-satunya tempat yang menentukan apakah sebuah metode pembayaran
 * ditangani oleh Midtrans QRIS. Dipakai oleh completePayment() dan
 * PaymentConfirmScreen agar keduanya tidak pernah berbeda pendapat.
 */
export const isQrisPaymentMethod = (method) => {
  if (!method) return false;
  const id = String(method.id || '').toLowerCase();
  const name = String(method.name || '').toLowerCase();
  return id.includes('qris') || id === 'midtrans' || name.includes('qris');
};

export const AppProvider = ({ children, initialScreen }) => {
  const [currentScreen, setCurrentScreen] = useState(() => initialScreen || getScreenFromPath());
  const [currentPath, setCurrentPath] = useState(() => {
    if (typeof window === 'undefined') return SCREEN_TO_PATH[initialScreen] || '/';
    return normalizePath(window.location.pathname);
  });

  
  
  
  
  
  
  
  
  
  
  
  
  
  const [user, setUser] = useState(() => {
    try {
      const stored = getStoredSession();
      return stored?.user ? normalizeUser(stored.user) : EMPTY_USER;
    } catch {
      
      
      return EMPTY_USER;
    }
  });
  
  const userRef = useRef(EMPTY_USER);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [sessionToken, setSessionToken] = useState(() => getStoredSession()?.token || null);
  
  
  
  
  const [verificationState, setVerificationState] = useState(() => getPendingVerification());

  
  
  
  const [books, setBooks] = useState([]);
  const [activeBook, setActiveBook] = useState(null);
  const [events, setEvents] = useState([]);
  const [carouselSlides, setCarouselSlides] = useState([]);
  
  
  
  const [catalogError, setCatalogError] = useState(null);
  const [agendaError, setAgendaError] = useState(null);

  
  
  const [selectedPlan, setSelectedPlan] = useState({
    id: 'monthly',
    title: 'Paket Bulanan',
    price: 25000,
    formattedPrice: 'Rp 25.000',
    period: '/bulan'
  });
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(PAYMENT_METHODS[1].options[0]);
  const [paymentPhone, setPaymentPhone] = useState('');
  const [paymentAgreed, setPaymentAgreed] = useState(false);
  const [lastPaymentResult, setLastPaymentResult] = useState(() => getStoredLastPayment());
  const [subscriptions, setSubscriptions] = useState([]);

  
  
  
  useEffect(() => {
    saveLastPayment(lastPaymentResult);
  }, [lastPaymentResult]);

  
  
  const routerNavigatorRef = useRef(null);
  const setRouterNavigator = useCallback((nav) => { routerNavigatorRef.current = nav; }, []);

  
  
  
  const screenRef = useRef(currentScreen);

  
  
  
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

  
  
  
  
  
  
  
  
  
  
  const navigateTo = useCallback((screen, { replace = false, currentRole, adminTab } = {}) => {
    let destScreen = screen;
    const effectiveRole = currentRole !== undefined ? currentRole : user.role;
    
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
      
      
      const fallbackScreen = 'home';
      if (import.meta.env?.DEV) {
        console.warn(
          `[navigateTo] Layar "${destScreen}" tidak ada di SCREEN_TO_PATH sehingga tidak punya <Route>. ` +
          `Diarahkan ke layar default "${fallbackScreen}" (${SCREEN_TO_PATH[fallbackScreen]}). ` +
          `Tambahkan pemetaannya di src/context/AppContext.jsx + src/App.jsx bila layar ini memang nyata.`
        );
      }
      destScreen = fallbackScreen;
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
    
    
    
  }, [currentScreen, user.role]);

  
  
  const setVerification = useCallback((nextValue) => {
    setVerificationState(nextValue);
    if (nextValue) {
      
      
      
      const { devOtp: _devOnly, ...persisted } = nextValue;
      savePendingVerification(persisted);
    } else {
      clearPendingVerification();
    }
  }, []);

  const clearVerification = useCallback(() => setVerification(null), [setVerification]);

  const refreshBooks = useCallback(async () => {
    try {
      const payload = await apiJson('/api/books');
      const nextBooks = (payload.books || []).map(normalizeBook);
      setBooks(nextBooks);
      setActiveBook((current) => nextBooks.find((book) => book.id === current?.id) || null);
      setCatalogError(null);
      return nextBooks;
    } catch (loadError) {
      
      
      setCatalogError(readableError(loadError));
      throw loadError;
    }
  }, []);

  const refreshEvents = useCallback(async () => {
    try {
      const payload = await apiJson('/api/events');
      const nextEvents = (payload.events || []).map(normalizeEvent);
      setEvents(nextEvents);
      setAgendaError(null);
      return nextEvents;
    } catch (loadError) {
      
      
      setAgendaError(readableError(loadError));
      throw loadError;
    }
  }, []);

  
  
  
  const refreshCarousel = useCallback(async () => {
    try {
      const payload = await apiJson('/api/carousel');
      setCarouselSlides((payload.slides || []).map(normalizeCarouselSlide));
    } catch {
      setCarouselSlides([]);
    }
  }, []);

  
  

  
  
  useEffect(() => {
    
    
    
    refreshBooks().catch(() => {});
    refreshEvents().catch(() => {});
    refreshCarousel().catch(() => {});
  }, [refreshBooks, refreshEvents, refreshCarousel]);

  useEffect(() => {
    let cancelled = false;
    const restoreSession = async () => {
      const storedSession = getStoredSession();
      if (!storedSession?.token) {
        if (!cancelled) setAuthReady(true);
        return;
      }

      try {
        const payload = await apiJson('/api/auth/me', { headers: authHeaders(storedSession.token) });
        if (cancelled) return;
        const restoredUser = normalizeUser(payload.user);
        setSessionToken(storedSession.token);
        setUser(restoredUser);
        setIsLoggedIn(true);

        
        
        
        const bootPath = normalizePath(window.location.pathname);

        
        
        
        
        
        
        
        if (restoredUser.role !== 'admin') {
          
          if (bootPath === '/admin' || bootPath === '/admin-dashboard' || currentScreen === 'admin-dashboard') {
            screenRef.current = 'home';
            setCurrentScreen('home');
            setCurrentPath('/');
            routerNavigatorRef.current?.('/', { replace: true });
          }
        } else {
          const bootIsAdminPath = PATH_TO_SCREEN[bootPath] === 'admin-dashboard';
          screenRef.current = 'admin-dashboard';
          setCurrentScreen('admin-dashboard');
          if (bootIsAdminPath) {
            setCurrentPath(bootPath);
          } else {
            setCurrentPath('/admin');
            routerNavigatorRef.current?.('/admin', { replace: true });
          }
        }

        
        try {
          const subPayload = await apiJson('/api/subscriptions/my', { headers: authHeaders(storedSession.token) });
          if (!cancelled && Array.isArray(subPayload.subscriptions)) {
            setSubscriptions(subPayload.subscriptions.map((sub) => ({
              id: sub.id,
              planName: sub.plan_name,
              price: Number(sub.price) ? `Rp ${Number(sub.price).toLocaleString('id-ID')}` : sub.price,
              status: sub.status,
              period: sub.period,
              ref: sub.ref_code,
              createdAt: sub.created_at
            })));
          }
        } catch {
          
        }
      } catch (restoreError) {
        
        
        
        const rejected = restoreError?.status === 401 || restoreError?.status === 403;
        if (rejected) {
          clearSession();
          if (!cancelled) {
            setSessionToken(null);
            setUser(EMPTY_USER);
            setIsLoggedIn(false);
          }
        } else if (!cancelled && storedSession.user?.id) {
          
          
          
          setSessionToken(storedSession.token);
          setUser(normalizeUser(storedSession.user));
          setIsLoggedIn(true);
        }
      } finally {
        if (!cancelled) setAuthReady(true);
      }
    };
    restoreSession();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  
  
  
  
  
  
  
  
  
  
  
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

  
  
  
  
  const syncUserFromBackend = useCallback(async ({ silent = false } = {}) => {
    const storedSession = getStoredSession();
    if (!storedSession?.token) return;
    try {
      const payload = await apiJson('/api/auth/me', { headers: authHeaders(storedSession.token) });
      if (!payload?.user) return;
      const refreshedUser = normalizeUser(payload.user);
      const previousUser = userRef.current;
      userRef.current = refreshedUser;

      if (previousUser?.id && previousUser.role !== refreshedUser.role) {
        
        
        applyRoleChange(refreshedUser.role, { notify: true });
      }
      if (userSignature(previousUser) !== userSignature(refreshedUser)) {
        setUser(refreshedUser);
      }
    } catch {
      
      if (!silent && import.meta.env?.DEV) {
        console.warn('[syncUserFromBackend] gagal menyegarkan user dari backend.');
      }
    }
  }, [applyRoleChange]);

  useEffect(() => {
    if (!isLoggedIn || !sessionToken) return;

    const handleFocus = () => {
      syncUserFromBackend({ silent: true });
    };

    const handleVisibility = () => {
      if (typeof document !== 'undefined' && !document.hidden) {
        syncUserFromBackend({ silent: true });
      }
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('visibilitychange', handleVisibility);

    
    
    
    
    const intervalId = setInterval(() => {
      if (typeof document !== 'undefined' && !document.hidden) {
        syncUserFromBackend({ silent: true });
      }
    }, 15000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('visibilitychange', handleVisibility);
      clearInterval(intervalId);
    };
  }, [isLoggedIn, sessionToken, syncUserFromBackend]);

  useEffect(() => {
    if (isLoggedIn && sessionToken) {
      saveSession({ token: sessionToken, user });
    }
  }, [isLoggedIn, sessionToken, user]);

  const login = useCallback((apiUser, token) => {
    const loggedInUser = normalizeUser(apiUser);
    if (!token) {
      throw new Error('Token sesi tidak ditemukan dari server.');
    }
    setSessionToken(token);
    saveSession({ token, user: loggedInUser });
    setUser(loggedInUser);
    setIsLoggedIn(true);
    setAuthReady(true);
    
    
    
    const destScreen = consumeIntendedScreen(loggedInUser.role);
    navigateTo(destScreen, {
      replace: true,
      currentRole: loggedInUser.role
    });
  }, [consumeIntendedScreen, navigateTo]);

  const logout = useCallback(() => {
    clearSession();
    
    clearVerification();
    
    clearIntendedLocation();
    setSessionToken(null);
    setUser(EMPTY_USER);
    setIsLoggedIn(false);
    navigateTo('login', { replace: true });
  }, [clearVerification, navigateTo]);

  const openReader = useCallback((book) => {
    setActiveBook(book);
    navigateTo('reader');
  }, [navigateTo]);

  
  
  
  const broadcastRoleChange = useCallback((role) => {
    if (typeof BroadcastChannel === 'undefined') return;
    try {
      const channel = new BroadcastChannel('wahidiyah-role-sync');
      channel.postMessage({ role });
      channel.close();
    } catch {
      
    }
  }, []);

  const updateUserRole = useCallback((userId, role) => {
    if (userRef.current?.id !== userId) return;
    userRef.current = { ...userRef.current, role };
    setUser((current) => ({ ...current, role }));
    applyRoleChange(role);
    broadcastRoleChange(role);
  }, [applyRoleChange, broadcastRoleChange]);

  
  
  
  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return undefined;
    const channel = new BroadcastChannel('wahidiyah-role-sync');
    channel.onmessage = (event) => {
      const nextRole = event?.data?.role;
      if (nextRole && userRef.current && userRef.current.role !== nextRole) {
        userRef.current = { ...userRef.current, role: nextRole };
        setUser((current) => ({ ...current, role: nextRole }));
        applyRoleChange(nextRole, { notify: true });
      }
    };
    return () => channel.close();
  }, [applyRoleChange]);

  
  
  
  
  
  const patchUser = useCallback((fields) => {
    setUser((current) => normalizeUser(
      typeof fields === 'function' ? { ...current, ...fields(current) } : { ...current, ...fields }
    ));
  }, []);

  const isSubscriptionActive = useCallback((targetUser) => {
    return Boolean(targetUser?.isPro);
  }, []);

  const refreshSubscriptions = useCallback(async () => {
    const stored = getStoredSession();
    if (!stored?.token) return [];
    try {
      const payload = await apiJson('/api/subscriptions/my', { headers: authHeaders(stored.token) });
      const subs = (payload.subscriptions || []).map((sub) => ({
        id: sub.id,
        planName: sub.plan_name,
        price: Number(sub.price) ? `Rp ${Number(sub.price).toLocaleString('id-ID')}` : sub.price,
        status: sub.status,
        period: sub.period,
        ref: sub.ref_code,
        
        
        expiresAt: sub.expires_at || null,
        createdAt: sub.created_at
      }));
      setSubscriptions(subs);
      return subs;
    } catch {
      return [];
    }
  }, []);

  const clearLastPaymentResult = useCallback(() => {
    setLastPaymentResult(null);
    clearLastPayment();
  }, []);

  const completePayment = useCallback(async () => {
    const now = new Date();
    
    
    
    const expiry = new Date(now);
    expiry.setMonth(expiry.getMonth() + 1);
    const periodStr = `${now.toLocaleDateString('id-ID')} – ${expiry.toLocaleDateString('id-ID')}`;
    // refNo di sini hanya placeholder untuk tampilan di antara klik dan respons server.
    // Angka definitif diambil dari payload.transaction.refNo di bawah.
    const refNo = `0000${Math.floor(10000000 + Math.random() * 90000000)}`;

    const result = {
      refNo,
      dateStr: `${now.toLocaleDateString('id-ID')}, ${now.toLocaleTimeString('id-ID')}`,
      periodStr,
      amount: selectedPlan.price,
      adminFee: null,
      totalPaid: null,
      methodName: selectedPaymentMethod?.name || 'Bank Transfer',
      planName: selectedPlan.title
    };
    setLastPaymentResult(result);

    // Bila QRIS Midtrans: server sudah membuat transaksi (charge) dan mengaktifkan
    // langganan lewat webhook / polling status. Jadi JANGAN membuat transaksi kedua —
    // cukup sinkronkan tampilan dengan status terkini dari server.
    if (isQrisPaymentMethod(selectedPaymentMethod)) {
      try {
        const me = await apiJson('/api/auth/me', { headers: authHeaders(getStoredSession()?.token) });
        if (me?.user) {
          patchUser((current) => ({
            ...normalizeUser({ ...current, ...me.user }),
            isPro: Boolean(me.user.isPro)
          }));
        }
        const subs = await refreshSubscriptions();
        const latest = subs[0];
        setLastPaymentResult((current) => ({
          ...(current || {}),
          refNo: latest?.ref || current?.refNo,
          periodStr: latest?.period || current?.periodStr,
          amount: latest?.price || current?.amount,
          planName: latest?.planName || current?.planName
        }));
      } catch (error) {
        console.warn('Gagal menyinkronkan status langganan setelah pembayaran QRIS:', error.message);
      }
      return;
    }

    const stored = getStoredSession();
    if (stored?.token) {
      try {
        const payload = await apiJson('/api/transactions', {
          method: 'POST',
          headers: {
            ...authHeaders(stored.token),
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            plan_name: selectedPlan.title,
            amount: selectedPlan.price,
            admin_fee: adminFee,
            total_paid: totalPaid,
            payment_method: selectedPaymentMethod?.name || 'Bank Transfer',
            period: periodStr
          })
        });

        
        
        
        
        
        const settledExpiry = payload.user?.subscription_expires_at || expiry.toISOString();
        const settledPeriod = payload.transaction?.periodStr || payload.subscription?.period || periodStr;
        if (payload.transaction?.refNo) {
          setLastPaymentResult((current) => ({ ...current, refNo: payload.transaction.refNo }));
        }

        
        
        
        
        if (payload.alreadyPro) {
          patchUser((current) => ({
            ...normalizeUser({ ...current, ...payload.user }),
            isPro: true,
            activePlan: null,
            subscriptionExpiresAt: payload.user?.subscription_expires_at || expiry.toISOString()
          }));
          return;
        }

        
        
        
        if (payload.pendingVerification) {
          setLastPaymentResult((current) => ({ ...current, pendingVerification: true }));
          return;
        }

        if (payload.user) {
          
          
          
          patchUser((current) => ({
            ...normalizeUser({ ...current, ...payload.user }),
            isPro: true,
            activePlan: null,
            subscriptionExpiresAt: settledExpiry,
            subscriptionPeriod: settledPeriod
          }));
        } else {
          patchUser({
            isPro: true,
            activePlan: null,
            subscriptionExpiresAt: settledExpiry,
            subscriptionPeriod: settledPeriod
          });
        }

        if (payload.subscription) {
          const subItem = {
            id: payload.subscription.id,
            planName: payload.subscription.planName,
            price: selectedPlan.formattedPrice,
            status: payload.subscription.status,
            period: payload.subscription.period,
            ref: payload.subscription.ref
          };
          setSubscriptions((current) => [subItem, ...current]);
        }
        return;
      } catch (error) {
        console.warn('Gagal menyimpan transaksi ke backend, beralih ke state lokal:', error.message);
      }
    }

    
    patchUser({
      isPro: true,
      activePlan: null,
      subscriptionExpiresAt: null,
      subscriptionPeriod: periodStr
    });
    setSubscriptions((current) => [{ id: `sub-${Date.now()}`, planName: selectedPlan.title, price: selectedPlan.formattedPrice, status: 'Aktif', period: periodStr, ref: `REF-${refNo.slice(-8)}` }, ...current]);
  }, [patchUser, selectedPaymentMethod, selectedPlan]);

  const value = useMemo(() => ({
    currentScreen,
    currentPath,
    navigateTo,
    user,
    setUser,
    patchUser,
    isLoggedIn,
    authReady,
    sessionToken,
    login,
    logout,
    verification: verificationState,
    setVerification,
    clearVerification,
    rememberIntendedLocation,
    setRouterNavigator,
    syncScreenFromPath,
    books,
    catalogError,
    refreshBooks,
    activeBook,
    openReader,
    selectedPlan,
    setSelectedPlan,
    selectedPaymentMethod,
    setSelectedPaymentMethod,
    paymentPhone,
    setPaymentPhone,
    paymentAgreed,
    setPaymentAgreed,
    lastPaymentResult,
    clearLastPaymentResult,
    completePayment,
    subscriptions,
    refreshSubscriptions,
    role: user.role,
    events,
    agendaError,
    setEvents,
    refreshEvents,
    carouselSlides,
    refreshCarousel,
    updateUserRole,
    isSubscriptionActive,
  }), [
    currentScreen,
    currentPath,
    navigateTo,
    user,
    patchUser,
    isLoggedIn,
    authReady,
    sessionToken,
    login,
    logout,
    verificationState,
    setVerification,
    clearVerification,
    rememberIntendedLocation,
    books,
    catalogError,
    refreshBooks,
    activeBook,
    openReader,
    selectedPlan,
    selectedPaymentMethod,
    paymentPhone,
    paymentAgreed,
    lastPaymentResult,
    clearLastPaymentResult,
    completePayment,
    subscriptions,
    refreshSubscriptions,
    events,
    agendaError,
    refreshEvents,
    carouselSlides,
    refreshCarousel,
    updateUserRole,
    isSubscriptionActive,
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => useContext(AppContext);






export { EMPTY_USER, normalizeUser, normalizeEvent, normalizeTransaction };
