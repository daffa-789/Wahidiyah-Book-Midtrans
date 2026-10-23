import React from 'react';
import { PanelLeft, ShieldCheck } from 'lucide-react';
import { BrandMark } from '@ui/BrandMark';
import { ThemeToggle } from '@ui/ThemeToggle';
import { SidebarNavSection } from './SidebarNavButton';

export const SidebarContent = React.memo(({
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
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-semantic-mutedOnDark transition-colors duration-200 hover:bg-cream-50/5 hover:text-cream-50 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
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
            className="flex h-10 w-10 items-center justify-center rounded-md text-cream-50 transition-colors duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 bg-brand-700 hover:bg-brand-600 focus-visible:ring-brand-500"
          >
            {isAdminNav
              ? <ShieldCheck className="h-[18px] w-[18px]" strokeWidth={1.9} />
              : <BrandMark className="h-10 w-10 rounded-md" />}
          </button>
          {collapseToggle}
          <ThemeToggle variant="onDark" />
        </div>

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
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-cream-50 bg-brand-700"
          >
            {isAdminNav
              ? <ShieldCheck className="h-[15px] w-[15px]" strokeWidth={2} />
              : <BrandMark className="h-7 w-7 rounded-lg" />}
          </span>
          {isAdminNav ? (
            <span className="flex min-w-0 flex-col">
              <span className="truncate font-display text-body font-bold leading-tight tracking-tight text-cream-50">
                Wahidiyah Book
              </span>
              <span className="mt-0.5 self-start rounded border border-brand-400/30 bg-brand-400/15 px-1.5 py-px text-overline font-bold uppercase tracking-[0.14em] text-brand-200">
                Panel Admin
              </span>
            </span>
          ) : (
            <span className="min-w-0 font-display text-lead font-bold leading-[1.15] tracking-tight text-cream-50">
              Wahidiyah<br />Book
            </span>
          )}
        </button>
        <div className="flex items-center gap-1">
          <ThemeToggle variant="onDark" />
          {collapseToggle}
        </div>
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
