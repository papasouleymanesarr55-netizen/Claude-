import { PanelRight, Search, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useMatches, useNavigate, useSearchParams } from 'react-router';
import { IconButton } from '@/components/ui/IconButton';
import { cn } from '@/lib/cn';
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

function SearchField({ autoFocus, className }: { autoFocus?: boolean; className?: string }) {
  const { t } = useTranslation();
  const handle = useRouteHandle();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const [value, setValue] = useState(params.get('q') ?? '');

  // Garde le champ synchronisé avec l'URL (navigation, réinitialisation des filtres…).
  const urlQuery = params.get('q') ?? '';
  const [lastUrlQuery, setLastUrlQuery] = useState(urlQuery);
  if (urlQuery !== lastUrlQuery) {
    setLastUrlQuery(urlQuery);
    setValue(urlQuery);
  }

  const apply = (q: string) => {
    setValue(q);
    if (handle?.searchable) {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (q) next.set('q', q);
          else next.delete('q');
          return next;
        },
        { replace: true },
      );
    } else if (q) {
      navigate(`/explorer?q=${encodeURIComponent(q)}`);
    }
  };

  return (
    <label
      className={cn(
        'flex h-11 items-center gap-2.5 rounded-full border border-white/[0.05] bg-card px-4 text-muted transition-colors focus-within:border-accent/40',
        className,
      )}
    >
      <Search aria-hidden className="size-4 shrink-0" />
      <span className="sr-only">{t('topbar.searchLabel')}</span>
      <input
        type="search"
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => apply(e.target.value)}
        placeholder={t('topbar.search')}
        className="w-full min-w-0 bg-transparent text-[13.5px] text-text placeholder:text-muted/80 focus:outline-none"
      />
    </label>
  );
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
            <SearchField autoFocus className="h-10 flex-1" />
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
          <SearchField className="w-[260px] lg:w-[320px]" />
          {actions}
          {avatar}
        </div>
      </div>
    </header>
  );
}
