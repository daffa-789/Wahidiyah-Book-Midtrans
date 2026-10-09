import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AppProvider } from '@context/AppContext';
import { ThemeProvider, useTheme } from '@theme/ThemeProvider';
import { ErrorBoundary } from '@ui/ErrorBoundary';
import { Toaster } from 'sonner';
import './theme/themeInjector.js';
import './index.css';

/* Sonner (toast) merender lewat portal di luar shell aplikasi, jadi warnanya
   tidak ikut berubah otomatis — kita teruskan tema aktif secara eksplisit. */
const AppToaster = () => {
  const { theme } = useTheme();
  return (
    <Toaster
      position="top-center"
      expand
      visibleToasts={1}
      closeButton
      duration={8000}
      theme={theme}
    />
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <BrowserRouter>
          <AppProvider>
            <App />
            <AppToaster />
          </AppProvider>
        </BrowserRouter>
      </ThemeProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);

if (typeof window !== 'undefined' && 'serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('PWA ServiceWorker registration failed:', err);
    });
  });
}
