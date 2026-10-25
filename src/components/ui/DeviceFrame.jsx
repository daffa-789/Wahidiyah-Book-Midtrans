import React, { useState, useMemo, useCallback, Fragment } from 'react';
import { Menu } from 'lucide-react';
import { Transition } from '@headlessui/react';
import { useApp } from '@context/AppContext';
import { ThemeToggle } from '@ui/ThemeToggle';
import { BrandMark } from '@ui/BrandMark';
import { tabIdFromPath } from '@lib/navigation';
import { SidebarContent } from '../layout/SidebarContent';
import { LogoutConfirmDialog } from '../layout/LogoutConfirmDialog';
import { MobileBottomNav } from '../layout/MobileBottomNav';
import { buildSidebarSections, ACTIVE_KEYS_BY_SCREEN } from '../layout/navigationConfig';

const DeviceFrameBase = ({ children }) => {
  const { currentScreen, currentPath, navigateTo, user, logout } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  const isAdmin = user?.role === 'admin';

  const activeKeys = useMemo(() => {
    if (isAdmin) return [`admin-${tabIdFromPath(currentPath)}`];
    return ACTIVE_KEYS_BY_SCREEN[currentScreen] || [];
  }, [isAdmin, currentScreen, currentPath]);

  const sections = useMemo(
    () => buildSidebarSections(isAdmin, activeKeys),
    [isAdmin, activeKeys]
  );

  const handleNavClick = useCallback((target) => {
    if (target === 'logout') {
      setMobileMenuOpen(false);
      setLogoutConfirmOpen(true);
      return;
    }
    if (typeof target === 'string' && target.startsWith('admin:')) {
      navigateTo('admin-dashboard', { adminTab: target.slice('admin:'.length) });
      setMobileMenuOpen(false);
      return;
    }
    navigateTo(target);
    setMobileMenuOpen(false);
  }, [navigateTo]);

  const handleConfirmLogout = useCallback(() => {
    setLogoutConfirmOpen(false);
    setMobileMenuOpen(false);
    logout();
  }, [logout]);

  return (
    <div className="app-surface relative flex min-h-screen w-full flex-col bg-cream-50 font-sans text-ink-800 md:flex-row">
      {/* Sidebar Desktop */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 hidden shrink-0 select-none flex-col border-r border-cream-50/[0.06] bg-ink-900 transition-[width] duration-300 ease-out md:flex ${
          sidebarCollapsed ? 'w-[68px]' : 'w-[218px]'
        }`}
      >
        <div className={`h-full w-full ${sidebarCollapsed ? 'px-2 py-3' : 'px-3 py-4'}`}>
          <SidebarContent
            onNavClick={handleNavClick}
            isCollapsed={sidebarCollapsed}
            isMobile={false}
            isAdminNav={isAdmin}
            sections={sections}
            setSidebarCollapsed={setSidebarCollapsed}
            setMobileMenuOpen={setMobileMenuOpen}
          />
        </div>
      </aside>

      {/* Header Mobile */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-cream-300 bg-cream-50/95 px-4 py-2.5 backdrop-blur-md md:hidden">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="flex h-11 w-11 items-center justify-center rounded-md text-ink-700 transition-colors duration-200 hover:bg-cream-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            aria-label="Buka menu navigasi"
          >
            <Menu className="h-5 w-5" strokeWidth={2} />
          </button>

          <button
            type="button"
            onClick={() => navigateTo(isAdmin ? 'admin-dashboard' : 'home')}
            className="flex items-center gap-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-lg"
          >
            
            <span className="font-display text-lead font-bold tracking-tight text-ink-900">
              {isAdmin ? 'Panel Admin' : 'E-Book Wahidiyah'}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-1">
          <ThemeToggle />
          {!isAdmin && (
            <button
              type="button"
              onClick={() => navigateTo('profile-edit')}
              aria-label="Buka profil saya"
              className="flex h-11 w-11 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-brand-100 text-caption font-bold text-brand-800 ring-1 ring-brand-200">
                {(user?.name || 'U').split(' ').map((s) => s[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || 'U'}
              </span>
            </button>
          )}
        </div>
      </header>

      {/* Drawer Menu Mobile */}
      <Transition show={mobileMenuOpen} as={Fragment}>
        <div className="fixed inset-0 z-50 md:hidden">
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div
              className="fixed inset-0 bg-ink-900/60 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
              aria-hidden="true"
            />
          </Transition.Child>

          <Transition.Child
            as={Fragment}
            enter="transition-transform ease-out duration-300"
            enterFrom="-translate-x-full"
            enterTo="translate-x-0"
            leave="transition-transform ease-in duration-200"
            leaveFrom="translate-x-0"
            leaveTo="-translate-x-full"
          >
            <div className="fixed inset-y-0 left-0 flex w-[280px] max-w-[85vw] flex-col overflow-y-auto bg-ink-900 px-3 py-4 shadow-2xl thin-scrollbar">
              <SidebarContent
                onNavClick={handleNavClick}
                isCollapsed={false}
                isMobile
                isAdminNav={isAdmin}
                sections={sections}
                setSidebarCollapsed={setSidebarCollapsed}
                setMobileMenuOpen={setMobileMenuOpen}
              />
            </div>
          </Transition.Child>
        </div>
      </Transition>

      {/* Dialog Konfirmasi Logout */}
      <LogoutConfirmDialog
        isOpen={logoutConfirmOpen}
        onCancel={() => setLogoutConfirmOpen(false)}
        onConfirm={handleConfirmLogout}
      />

      {/* Konten Halaman Utama */}
      <div
        className={`flex min-h-screen min-w-0 flex-1 flex-col bg-cream-50 transition-[margin] duration-300 ease-out ${
          sidebarCollapsed ? 'md:ml-[68px]' : 'md:ml-[218px]'
        }`}
      >
        <main className="flex w-full flex-1 flex-col">
          <div className="relative flex w-full flex-1 flex-col bg-cream-50 pb-20 md:pb-0">{children}</div>
        </main>
      </div>

      {/* Navigasi Bawah Mobile */}
      <MobileBottomNav
        isAdmin={isAdmin}
        activeKeys={activeKeys}
        onNavClick={handleNavClick}
        onOpenMenu={() => setMobileMenuOpen(true)}
      />
    </div>
  );
};

export const DeviceFrame = React.memo(DeviceFrameBase);
