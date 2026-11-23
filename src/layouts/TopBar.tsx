import { PanelRight, Search, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useMatches } from 'react-router';
import { SearchBox } from '@/features/search/SearchBox';
import { IconButton } from '@/components/ui/IconButton';
import { MQ_DESKTOP_UP, useMediaQuery } from '@/lib/useMediaQuery';
import { useShellState } from './shellState';
import { BrandMark } from './BrandMark';

export interface RouteHandle {
  titleKey: string;
  /** La page affiche une liste filtrable par la recherche. */
  searchable?: boolean;
  /** La page propose le panneau véhicule (en tiroir sous 1280 px). */
  vehiclePanel?: boolean;
}

function useRouteHandle(): RouteHandle | undefined {
  const matches = useMatches();
  return [...matches].reverse().find((m) => (m.handle as RouteHandle | undefined)?.titleKey)
    ?.handle as RouteHandle | undefined;
}

export function TopBar() {
  const { t } = useTranslation();
  const handle = useRouteHandle();
  const title = handle ? t(handle.titleKey) : '';
  const [mobileSearch, setMobileSearch] = useState(false);
  const location = useLocation();
  const prevPath = useRef(location.pathname);
  const isDesktop = useMediaQuery(MQ_DESKTOP_UP);
  const { setVehiclePanelOpen } = useShellState();
  const actions =
    handle?.vehiclePanel && !isDesktop ? (
      <IconButton
        label={t('topbar.openVehicle')}
        variant="surface"
        className="rounded-full"
        onClick={() => setVehiclePanelOpen(true)}
      >
        <PanelRight className="size-[18px]" />
      </IconButton>
    ) : null;

  useEffect(() => {
    if (prevPath.current !== location.pathname) {
      prevPath.current = location.pathname;
      setMobileSearch(false);
    }
  }, [location.pathname]);

  const avatar = (
    <span
      title={t('topbar.guest')}
      className="grid size-10 shrink-0 place-items-center rounded-full border border-white/[0.06] bg-surface text-[12px] font-semibold text-text"
    >
      <span aria-hidden>{t('topbar.guestInitials')}</span>
      <span className="sr-only">{t('topbar.guest')}</span>
    </span>
  );

  return (
    <header className="sticky top-0 z-30 bg-bg/85 backdrop-blur-md md:static md:bg-transparent md:backdrop-blur-none">
      {/* Mobile */}
      <div className="flex h-14 items-center justify-between gap-3 px-4 md:hidden">
        {mobileSearch ? (
          <>
            <SearchBox searchable={handle?.searchable ?? false} autoFocus className="flex-1" />
            <IconButton label={t('topbar.closeSearch')} onClick={() => setMobileSearch(false)}>
              <X className="size-5" />
            </IconButton>
          </>
        ) : (
          <>
            <div className="flex min-w-0 items-center gap-3">
              <BrandMark compact />
              <h1 className="truncate text-[17px] font-semibold tracking-tight">{title}</h1>
            </div>
            <div className="flex items-center gap-1.5">
              <IconButton label={t('topbar.searchLabel')} onClick={() => setMobileSearch(true)}>
                <Search className="size-5" />
              </IconButton>
              {actions}
              {avatar}
            </div>
          </>
        )}
      </div>

      {/* Tablette et desktop */}
      <div className="hidden h-[84px] items-center justify-between gap-6 px-6 md:flex xl:px-8">
        <div className="min-w-0">
          <p className="text-[12px] text-muted">
            {t('nav.pages')} <span className="text-muted/60">/</span>{' '}
            <span className="text-text/90">{title}</span>
          </p>
          <h1 className="mt-0.5 truncate text-[26px] leading-tight font-semibold tracking-tight">
            {title}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <SearchBox searchable={handle?.searchable ?? false} className="w-[280px] lg:w-[340px]" />
          {actions}
          {avatar}
        </div>
      </div>
    </header>
  );
}
