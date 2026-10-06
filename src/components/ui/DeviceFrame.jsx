import React, { useState, Fragment } from 'react';
import {
  Calendar,
  Home,
  Menu,
  LogOut,
  ShieldCheck,
  BookOpen,
  PanelLeft,
  Sparkles,
  ReceiptText,
  HelpCircle,
  Info,
  UserRound,

  LayoutDashboard,
  Users,
  CalendarDays,
  Activity,
  GalleryHorizontalEnd
} from 'lucide-react';
import { Transition } from '@headlessui/react';
import { useApp } from '@context/AppContext';

import { tabIdFromPath } from '@lib/navigation';
import { layout } from '@lib/styles';

const SidebarNavButton = ({ item, isCollapsed, onNavClick }) => {
  const Icon = item.icon;
  const isDanger = Boolean(item.danger);
  const isAdminAccent = item.accent === 'admin';

  if (isCollapsed) {
    return (
      <button
        type="button"
        onClick={() => onNavClick(item.target)}
        title={item.label}
        aria-label={item.label}
        aria-current={item.isActive ? 'page' : undefined}
        className={`relative h-11 w-11 rounded-xl flex items-center justify-center transition-colors duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 ${isDanger
          ? 'focus-visible:ring-rose-400'
          : isAdminAccent
            ? 'focus-visible:ring-gold-500'
            : 'focus-visible:ring-brand-500'
          } ${item.isActive
            ? isAdminAccent
              ? 'bg-gold-400/20 text-gold-100'
              : 'bg-brand-700 text-cream-50'
            : 'text-ink-400 hover:text-cream-50 hover:bg-cream-50/5'
          }`}
      >
        <Icon className="w-[18px] h-[18px]" strokeWidth={1.9} />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onNavClick(item.target)}
      aria-current={item.isActive ? 'page' : undefined}
      className={`group relative w-full h-11 flex items-center gap-3 pl-3 pr-3 rounded-xl transition-colors duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 ${isDanger
        ? 'focus-visible:ring-rose-400'
        : isAdminAccent
          ? 'focus-visible:ring-gold-500'
          : 'focus-visible:ring-brand-500'
        } ${item.isActive
          ? isAdminAccent
            ? 'bg-gold-400/15 text-gold-100'
            : 'bg-brand-700 text-cream-50'
          : 'text-ink-300 hover:text-cream-50 hover:bg-cream-50/5'
        }`}
    >

      <span
        aria-hidden="true"
        className={`absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-full transition-all duration-200 ${item.isActive ? 'h-5 bg-gold-400' : 'h-0 bg-transparent'
          }`}
      />
      <Icon
        className={`w-[18px] h-[18px] shrink-0 transition-colors duration-200 ${item.isActive
          ? 'text-gold-300'
          : isDanger
            ? 'text-rose-300/70 group-hover:text-rose-200'
            : 'text-ink-400 group-hover:text-cream-100'
          }`}
        strokeWidth={1.9}
      />
      <span className="truncate text-buttonMd font-semibold tracking-tight">{item.label}</span>
    </button>
  );
};

const SidebarNavSection = ({ items, isCollapsed, onNavClick }) => {
  if (!items.length) return null;
  return (
    <div className={isCollapsed ? 'flex flex-col items-center gap-1' : 'space-y-0.5'}>
      {items.map((item) => (
        <SidebarNavButton key={item.id} item={item} isCollapsed={isCollapsed} onNavClick={onNavClick} />
      ))}
    </div>
  );
};

const SIDEBAR_SECTIONS = [
  {
    id: 'utama',
    title: 'Utama',
    keys: ['home', 'calendar', 'subscription-history', 'pro', 'help-center', 'about']
  },
  { id: 'akun', title: 'Akun', keys: ['profile', 'logout'] }

];

const ADMIN_SECTION_KEYS = [
  'admin-overview',
  'admin-books',
  'admin-users',
  'admin-events',
  'admin-carousel',
  'admin-logs'
];

const ADMIN_SECTION = {
  id: 'administrasi',
  title: 'Administrasi',
  keys: [...ADMIN_SECTION_KEYS, 'logout']
};

const SIDEBAR_ITEM_DEFS = {
  home: { label: 'Beranda', icon: Home, target: 'home' },
  calendar: { label: 'Kalender', icon: Calendar, target: 'calendar' },
  'subscription-history': { label: 'Riwayat Langganan', icon: ReceiptText, target: 'subscription-history' },
  pro: { label: 'Pro', icon: Sparkles, target: 'pro' },
  'help-center': { label: 'Pusat Bantuan', icon: HelpCircle, target: 'help-center' },
  about: { label: 'Tentang', icon: Info, target: 'about' },
  profile: { label: 'Profil', icon: UserRound, target: 'profile-edit' },
  logout: { label: 'Log Out', icon: LogOut, target: 'logout', danger: true },

  'admin-overview': { label: 'Ringkasan', icon: LayoutDashboard, target: 'admin:overview' },
  'admin-books': { label: 'Koleksi', icon: BookOpen, target: 'admin:books' },
  'admin-users': { label: 'Pengguna', icon: Users, target: 'admin:users' },
  'admin-events': { label: 'Agenda', icon: CalendarDays, target: 'admin:events' },
  'admin-carousel': { label: 'Carousel', icon: GalleryHorizontalEnd, target: 'admin:carousel' },
  'admin-logs': { label: 'Log Aktivitas', icon: Activity, target: 'admin:logs' }
};

const ACTIVE_KEYS_BY_SCREEN = {
  home: ['home'],
  calendar: ['calendar'],
  pro: ['pro'],
  'subscription-history': ['subscription-history'],
  'help-center': ['help-center'],
  about: ['about'],
  'profile-edit': ['profile']
};

const buildSidebarSections = (isAdmin, activeKeys) => {
  const showAdminNav = isAdmin;
  const source = showAdminNav ? [ADMIN_SECTION] : SIDEBAR_SECTIONS;

  return source
    .map((section) => ({
      id: section.id,
      title: section.title,
      items: section.keys.map((key) => ({
        id: key,
        ...SIDEBAR_ITEM_DEFS[key],

        accent: showAdminNav ? 'admin' : 'user',
        isActive: activeKeys.includes(key)
      }))
    }))
    .filter((section) => section.items.length > 0);
};

const SidebarContent = React.memo(({
  onNavClick,
  isCollapsed = false,
  isMobile = false,

  isAdminNav = false,
  sections,
  setSidebarCollapsed,
  setMobileMenuOpen
}) => {

  const handleToggleCollapse = React.useCallback(() => {
    if (isMobile) {
      setMobileMenuOpen(false);
      return;
    }
    setSidebarCollapsed((prev) => !prev);
  }, [isMobile, setMobileMenuOpen, setSidebarCollapsed]);

  const collapseToggle = (
    <button
      type="button"
      onClick={handleToggleCollapse}
      title={isMobile ? 'Tutup menu' : isCollapsed ? 'Perluas sidebar' : 'Ciutkan sidebar'}
      aria-label={isMobile ? 'Tutup menu' : isCollapsed ? 'Perluas sidebar' : 'Ciutkan sidebar'}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-ink-400 transition-colors duration-200 hover:bg-cream-50/5 hover:text-cream-50 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
    >
      <PanelLeft className="h-[17px] w-[17px]" strokeWidth={1.9} />
    </button>
  );

  if (isCollapsed) {
    return (
      <div className="flex h-full w-full flex-col items-center">

        <div className="flex flex-col items-center gap-1 pb-2">
          <button
            type="button"
            onClick={() => onNavClick(isAdminNav ? 'admin-dashboard' : 'home')}
            title={isAdminNav ? 'Panel Admin' : 'Wahidiyah Book'}
            aria-label={isAdminNav ? 'Panel Admin' : 'Wahidiyah Book'}
            className={`flex h-10 w-10 items-center justify-center rounded-xl text-cream-50 transition-colors duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 ${isAdminNav
              ? 'bg-gold-600 hover:bg-gold-500 focus-visible:ring-gold-400'
              : 'bg-brand-700 hover:bg-brand-600 focus-visible:ring-brand-500'
              }`}
          >
            {isAdminNav
              ? <ShieldCheck className="h-[18px] w-[18px]" strokeWidth={1.9} />
              : <BookOpen className="h-[18px] w-[18px]" strokeWidth={1.9} />}
          </button>
          {collapseToggle}
        </div>

        <div className="my-1 h-px w-6 bg-ink-700" aria-hidden="true" />

        <nav className="flex w-full flex-1 flex-col items-center gap-1 overflow-y-auto thin-scrollbar">
          {sections.map((section) => (
            <SidebarNavSection
              key={section.id}
              items={section.items}
              isCollapsed
              onNavClick={onNavClick}
            />
          ))}
        </nav>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col">

      <div className="flex items-center justify-between gap-2 pb-4">
        <button
          type="button"
          onClick={() => onNavClick(isAdminNav ? 'admin-dashboard' : 'home')}
          className="flex min-h-9 min-w-0 select-none items-center gap-2 text-left transition-colors duration-200 hover:opacity-80 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-lg"
        >
          <span
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-cream-50 ${isAdminNav ? 'bg-gold-600' : 'bg-brand-700'
              }`}
          >
            {isAdminNav
              ? <ShieldCheck className="h-[15px] w-[15px]" strokeWidth={2} />
              : <BookOpen className="h-[15px] w-[15px]" strokeWidth={2} />}
          </span>
          {isAdminNav ? (
            <span className="flex min-w-0 flex-col">
              <span className="truncate font-display text-body font-bold leading-tight tracking-tight text-cream-50">
                Wahidiyah Book
              </span>
              <span className="mt-0.5 self-start rounded border border-gold-400/30 bg-gold-400/10 px-1.5 py-px text-overline font-bold uppercase tracking-[0.14em] text-gold-200">
                Panel Admin
              </span>
            </span>
          ) : (
            <span className="truncate font-display text-lead font-bold tracking-tight text-cream-50">
              Wahidiyah Book
            </span>
          )}
        </button>
        {collapseToggle}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto thin-scrollbar">
        {sections.map((section) => (
          <SidebarNavSection
            key={section.id}
            items={section.items}
            isCollapsed={false}
            onNavClick={onNavClick}
          />
        ))}
      </nav>
    </div>
  );
});

const LogoutConfirmDialog = ({ isOpen, userName, onCancel, onConfirm }) => (
  <Transition show={isOpen} as={Fragment}>
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
      <Transition.Child
        as={Fragment}
        enter="transition-opacity ease-out duration-200"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="transition-opacity ease-in duration-150"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <div
          className="absolute inset-0 bg-ink-900/50 backdrop-blur-sm"
          onClick={onCancel}
          aria-hidden="true"
        />
      </Transition.Child>

      <Transition.Child
        as={Fragment}
        enter="transition ease-out duration-200"
        enterFrom="opacity-0 scale-95"
        enterTo="opacity-100 scale-100"
        leave="transition ease-in duration-150"
        leaveFrom="opacity-100 scale-100"
        leaveTo="opacity-0 scale-95"
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="logout-dialog-title"
          className="relative w-full max-w-sm rounded-3xl border border-cream-300 bg-cream-50 p-6 text-center shadow-2xl shadow-ink-900/25"
        >
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
            <LogOut className="h-5 w-5" strokeWidth={2} />
          </div>
          <h2 id="logout-dialog-title" className="mt-4 font-display text-h3 font-bold text-ink-900">
            Log Out dari akun?
          </h2>
          <p className="mt-1.5 text-xs leading-relaxed text-ink-500">
            Apakah Anda yakin ingin keluar dari sesi{' '}
            <span className="font-semibold text-ink-700">{userName || 'akun ini'}</span>?
            Masuk kembali diperlukan untuk mengakses koleksi Pro.
          </p>
          <div className="mt-6 grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={onCancel}
              className="h-11 rounded-2xl border border-cream-300 bg-cream-50 text-xs font-bold text-ink-600 transition-colors duration-200 hover:bg-cream-100 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-400"
            >
              Batal
            </button>
            <button
              type="button"
              data-testid="confirm-logout-btn"
              onClick={onConfirm}
              className="h-11 rounded-2xl bg-rose-600 text-xs font-bold text-white shadow-sm transition-colors duration-200 hover:bg-rose-700 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
            >
              Ya, Log Out
            </button>
          </div>
        </div>
      </Transition.Child>
    </div>
  </Transition>
);

const DeviceFrameBase = ({ children }) => {
  const { currentScreen, currentPath, navigateTo, user, logout } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  const isAdmin = user.role === 'admin';

  const activeKeys = React.useMemo(() => {
    if (isAdmin) return [`admin-${tabIdFromPath(currentPath)}`];
    return ACTIVE_KEYS_BY_SCREEN[currentScreen] || [];
  }, [isAdmin, currentScreen, currentPath]);

  const sections = React.useMemo(
    () => buildSidebarSections(isAdmin, activeKeys),
    [isAdmin, activeKeys]
  );

  const handleNavClick = React.useCallback((target) => {
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

  const handleConfirmLogout = React.useCallback(() => {
    setLogoutConfirmOpen(false);
    setMobileMenuOpen(false);
    logout();
  }, [logout]);

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-cream-50 font-sans text-ink-800 md:flex-row">

      <aside
        className={`fixed inset-y-0 left-0 z-50 hidden shrink-0 select-none flex-col border-r border-white/[0.06] bg-ink-900 transition-[width] duration-300 ease-out md:flex ${sidebarCollapsed ? 'w-[68px]' : 'w-[248px]'
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

      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-cream-300 bg-cream-50/95 px-4 py-2.5 backdrop-blur-md md:hidden">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="flex h-11 w-11 items-center justify-center rounded-xl text-ink-700 transition-colors duration-200 hover:bg-cream-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            aria-label="Buka menu navigasi"
          >
            <Menu className="h-5 w-5" strokeWidth={2} />
          </button>

          <button
            type="button"
            onClick={() => navigateTo(isAdmin ? 'admin-dashboard' : 'home')}
            className="flex items-center gap-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-lg"
          >
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-xl text-cream-50 ${isAdmin ? 'bg-gold-600' : 'bg-brand-700'
                }`}
            >
              {isAdmin
                ? <ShieldCheck className="h-4 w-4" strokeWidth={2} />
                : <BookOpen className="h-4 w-4" strokeWidth={2} />}
            </span>
            <span className="font-display text-lead font-bold tracking-tight text-ink-900">
              {isAdmin ? 'Panel Admin' : 'Wahidiyah Book'}
            </span>
          </button>
        </div>

        {!isAdmin && (
          <button
            type="button"
            onClick={() => navigateTo('profile-edit')}
            aria-label="Buka profil saya"
            className="flex h-11 w-11 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-brand-100 text-caption font-bold text-brand-800 ring-1 ring-brand-200">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className={layout.media} />
              ) : (
                (user.name || 'U').split(' ').map((s) => s[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || 'U'
              )}
            </span>
          </button>
        )}
      </header>

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

      <LogoutConfirmDialog
        isOpen={logoutConfirmOpen}
        userName={user.name}
        onCancel={() => setLogoutConfirmOpen(false)}
        onConfirm={handleConfirmLogout}
      />

      <div
        className={`flex min-h-screen min-w-0 flex-1 flex-col bg-cream-50 transition-[margin] duration-300 ease-out ${sidebarCollapsed ? 'md:ml-[68px]' : 'md:ml-[248px]'
          }`}
      >
        <main className="flex w-full flex-1 flex-col">
          <div className="relative flex w-full flex-1 flex-col bg-cream-50">{children}</div>
        </main>
      </div>
    </div>
  );
};

export const DeviceFrame = React.memo(DeviceFrameBase);
