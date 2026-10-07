import { Suspense, lazy, useEffect, useRef } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '@context/AppContext';
import { DeviceFrame } from '@ui/DeviceFrame';
import { InAppReminders } from '@ui/InAppReminders';
import { PwaInstallBanner } from './components/PwaInstallBanner';


import { LoginScreen } from '@features/auth/LoginScreen';
import { RegisterScreen } from '@features/auth/RegisterScreen';
import { HomeScreen } from '@features/home/HomeScreen';
import { CalendarScreen } from '@features/calendar/CalendarScreen';
import { ProScreen } from '@features/subscription/ProScreen';
import { PaymentMethodScreen } from '@features/payment/PaymentMethodScreen';
import { layout, typography, surfaces, controls } from '@lib/styles';




const VerifyEmailScreen = lazy(() => import('@features/auth/VerifyEmailScreen').then(m => ({ default: m.VerifyEmailScreen })));
const AuthCallbackScreen = lazy(() => import('@features/auth/AuthCallbackScreen').then(m => ({ default: m.AuthCallbackScreen })));
const GoogleSuccessScreen = lazy(() => import('@features/auth/GoogleSuccessScreen').then(m => ({ default: m.GoogleSuccessScreen })));
const ForgotPasswordScreen = lazy(() => import('@features/auth/ForgotPasswordScreen').then(m => ({ default: m.ForgotPasswordScreen })));
const PdfReaderScreen = lazy(() => import('@features/reader/PdfReaderScreen').then(m => ({ default: m.PdfReaderScreen })));
const PaymentConfirmScreen = lazy(() => import('@features/payment/PaymentConfirmScreen').then(m => ({ default: m.PaymentConfirmScreen })));
const PaymentSuccessScreen = lazy(() => import('@features/payment/PaymentSuccessScreen').then(m => ({ default: m.PaymentSuccessScreen })));
const EditProfileScreen = lazy(() => import('@features/profile/EditProfileScreen').then(m => ({ default: m.EditProfileScreen })));
const SubscriptionHistoryScreen = lazy(() => import('@features/profile/SubscriptionHistoryScreen').then(m => ({ default: m.SubscriptionHistoryScreen })));
const HelpCenterScreen = lazy(() => import('@features/help/HelpCenterScreen').then(m => ({ default: m.HelpCenterScreen })));
const AboutScreen = lazy(() => import('@features/about/AboutScreen').then(m => ({ default: m.AboutScreen })));
const AdminDashboard = lazy(() => import('@features/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));

const ScreenLoading = () => (
  <div className="min-h-[400px] flex items-center justify-center py-12">
    <div className="flex items-center gap-3 text-sm font-semibold text-ink-400">
      <span className="h-4 w-4 rounded-full border-2 border-brand-300 border-t-brand-700 animate-spin" />
      Memuat halaman…
    </div>
  </div>
);

const AuthBoot = () => (
  <div className="min-h-screen bg-cream-100 flex items-center justify-center px-6">
    <div className="flex items-center gap-3 rounded-2xl border border-cream-300 bg-cream-50 px-5 py-4 text-sm font-semibold text-ink-700 shadow-sm">
      <span className="h-4 w-4 rounded-full border-2 border-brand-200 border-t-brand-700 animate-spin" />
      Menyiapkan sesi aman…
    </div>
  </div>
);








const GuestOnly = ({ children }) => {
  const { isLoggedIn, authReady, rememberIntendedLocation } = useApp();
  const location = useLocation();
  const intendedPath = `${location.pathname}${location.search || ''}`;
  
  
  
  
  
  const wasAuthorizedHereRef = useRef(false);

  
  
  useEffect(() => {
    if (isLoggedIn) {
      wasAuthorizedHereRef.current = true;
      return;
    }
    if (!authReady || wasAuthorizedHereRef.current) return;
    rememberIntendedLocation(intendedPath);
  }, [authReady, isLoggedIn, intendedPath, rememberIntendedLocation]);

  if (!authReady) return <AuthBoot />;
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  return children;
};






const Framed = ({ children }) => (
  <DeviceFrame>{children}</DeviceFrame>
);
















const Shell = ({ children }) => (
  <GuestOnly>
    <Framed>{children}</Framed>
  </GuestOnly>
);













const UserOnly = ({ children }) => {
  const { authReady, user } = useApp();
  if (!authReady) return <AuthBoot />;
  if (user.role === 'admin') return <Navigate to="/admin" replace />;
  return children;
};

const shellPage = (node) => (
  <UserOnly>
    <Shell>
      <Suspense fallback={<ScreenLoading />}>{node}</Suspense>
      
      <InAppReminders />
    </Shell>
  </UserOnly>
);

const AdminRoute = ({ children }) => {
  const { isLoggedIn, authReady, user } = useApp();
  if (!authReady) return <AuthBoot />;
  
  
  
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  
  
  
  if (user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }
  return children;
};



const subscriptionHistoryPage = shellPage(<SubscriptionHistoryScreen />);
const helpCenterPage = shellPage(<HelpCenterScreen />);
const editProfilePage = shellPage(<EditProfileScreen />);





const adminPortalPage = (
  <Framed>
    <AdminRoute>
      <Suspense fallback={<ScreenLoading />}><AdminDashboard /></Suspense>
    </AdminRoute>
  </Framed>
);




const RouterBridge = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setRouterNavigator, syncScreenFromPath } = useApp();

  useEffect(() => {
    setRouterNavigator(navigate);
  }, [navigate, setRouterNavigator]);

  useEffect(() => {
    syncScreenFromPath(location.pathname);
  }, [location.pathname, syncScreenFromPath]);

  return null;
};

export function App() {
  return (
    <>
      <RouterBridge />
      <PwaInstallBanner />
      <Suspense fallback={<ScreenLoading />}>
      <Routes>
        
        <Route path="/" element={shellPage(<HomeScreen />)} />
        <Route path="/home" element={shellPage(<HomeScreen />)} />
        <Route path="/calendar" element={shellPage(<CalendarScreen />)} />

        
        
        <Route path="/reader" element={<UserOnly><GuestOnly><PdfReaderScreen /></GuestOnly></UserOnly>} />

        
        <Route path="/pro" element={shellPage(<ProScreen />)} />
        <Route path="/payment-method" element={shellPage(<PaymentMethodScreen />)} />
        <Route path="/payment-confirm" element={shellPage(<PaymentConfirmScreen />)} />
        <Route path="/payment-success" element={shellPage(<PaymentSuccessScreen />)} />

        
        <Route path="/pengaturan" element={<Navigate to="/profile" replace />} />
        <Route path="/profile" element={editProfilePage} />
        <Route path="/profile/edit" element={editProfilePage} />
        
        <Route path="/riwayat" element={subscriptionHistoryPage} />
        <Route path="/pengaturan/riwayat" element={subscriptionHistoryPage} />
        <Route path="/pengaturan/history" element={subscriptionHistoryPage} />
        <Route path="/profile/history" element={subscriptionHistoryPage} />

        
        <Route path="/help" element={helpCenterPage} />
        <Route path="/help-center" element={helpCenterPage} />
        <Route path="/about" element={shellPage(<AboutScreen />)} />

        
        <Route path="/login" element={<div className={layout.screen}><LoginScreen /></div>} />
        <Route path="/register" element={<div className={layout.screen}><RegisterScreen /></div>} />
        <Route path="/verify-email" element={<div className={layout.screen}><Suspense fallback={<ScreenLoading />}><VerifyEmailScreen /></Suspense></div>} />
        <Route path="/forgot-password" element={<div className={layout.screen}><Suspense fallback={<ScreenLoading />}><ForgotPasswordScreen /></Suspense></div>} />
        
        <Route path="/auth/callback" element={<div className={layout.screen}><Suspense fallback={<ScreenLoading />}><AuthCallbackScreen /></Suspense></div>} />

        
        <Route path="/auth/success" element={<div className={layout.screen}><Suspense fallback={<ScreenLoading />}><GoogleSuccessScreen /></Suspense></div>} />

        
        <Route path="/admin" element={adminPortalPage} />
        <Route path="/admin-dashboard" element={adminPortalPage} />
        <Route path="/admin/:tab" element={adminPortalPage} />

        
        <Route path="*" element={<div className={layout.screen}><LoginScreen /></div>} />
      </Routes>
      </Suspense>
    </>
  );
}

export default App;
