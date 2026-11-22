import { AlertTriangle, DatabaseZap, MapPin, MapPinned, SearchX } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/Card';
import { DemoBadge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { useData } from '@/features/data/DataProvider';
import {
  GeolocationNotice,
  LocateButton,
  ProviderFailureNotice,
  RadiusSelect,
  SearchAreaButton,
} from '@/features/location/LocationControls';
import { LazyMapView } from '@/features/map/LazyMapView';
import { distanceMeters, type LatLng } from '@/lib/geo';
import { cn } from '@/lib/cn';
import { MQ_TABLET_UP, useMediaQuery } from '@/lib/useMediaQuery';
import { BottomSheet } from './BottomSheet';
import { categoryIds } from './categories';
import { CategoryFilters } from './CategoryFilters';
import { filterPlaces } from './filter';
import { PlaceCard } from './PlaceCard';
import type { CategoryId } from './types';
import { usePlaceFilters } from './usePlaceFilters';

interface PlacesViewProps {
  /** Catégories proposées sur cette page (toutes par défaut). */
  scope?: CategoryId[];
  /** Action affichée à droite de l'en-tête (ex. bouton véhicule sur tablette). */
  headerAction?: ReactNode;
}

export function PlacesView({ scope = categoryIds, headerAction }: PlacesViewProps) {
  const { t } = useTranslation();
  const data = useData();
  const isTabletUp = useMediaQuery(MQ_TABLET_UP);
  const filters = usePlaceFilters();
  const { selectedId, setSelectedId } = filters;
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const activeCategories = useMemo(
    () => filters.categories.filter((c) => scope.includes(c)),
    [filters.categories, scope],
  );
  const scoped = useMemo(
    () => data.places.filter((p) => scope.includes(p.category)),
    [data.places, scope],
  );
  const visible = useMemo(
    () =>
      filterPlaces(scoped, { categories: activeCategories, query: filters.query }, (id) =>
        t(`categories.${id}`),
      ),
    [scoped, activeCategories, filters.query, t],
  );
  const availableCategories = scope.filter((c) => data.categories.includes(c));

  const select = useCallback((id: string) => setSelectedId(id), [setSelectedId]);

  // Fait défiler la liste jusqu'à l'établissement sélectionné (depuis la carte).
  useEffect(() => {
    if (!selectedId) return;
    const el = listRef.current?.querySelector<HTMLElement>(
      `[data-place-id="${CSS.escape(selectedId)}"]`,
    );
    el?.scrollIntoView?.({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
  }, [selectedId]);

  const { area, location } = data;
  const focus = useMemo(
    () => (area ? { center: area.center, radiusM: area.radiusM } : null),
    [area],
  );
  const userPosition = location?.source === 'device' ? location.position : null;

  // Proposer « Rechercher dans cette zone » quand l'utilisateur a déplacé la carte.
  const [movedCenter, setMovedCenter] = useState<LatLng | null>(null);
  const showSearchArea =
    movedCenter != null &&
    area != null &&
    distanceMeters(movedCenter, area.center) > area.radiusM * 0.25;
  const searchHere = () => {
    if (movedCenter) data.searchArea(movedCenter);
    setMovedCenter(null);
  };

  const sublabel = !location
    ? null
    : location.isDemo
      ? t('demo.location')
      : location.source === 'device' && location.accuracyM != null && location.accuracyM > 0
        ? t('location.accuracy', { meters: location.accuracyM })
        : (location.context ?? null);

  const mapProps = {
    places: visible,
    selectedId,
    focus,
    userPosition,
    onLocate: data.requestGeolocation,
    locatePending: data.geolocation.status === 'pending',
    onUserMove: setMovedCenter,
  };

  const locationHeader = (
    <div className="flex min-w-0 items-center gap-2.5">
      <MapPin
        aria-hidden
        className="size-5 shrink-0 text-accent"
        fill="currentColor"
        stroke="#1B211E"
      />
      <div className="min-w-0">
        <p className="truncate text-[19px] font-medium tracking-tight md:text-[22px]">
          {location?.label ??
            (location?.source === 'device'
              ? t('location.yourPosition')
              : t('places.positionUnknown'))}
        </p>
        {sublabel && <p className="truncate text-[12px] text-muted">{sublabel}</p>}
      </div>
    </div>
  );

  const countLabel = (
    <p className="text-[13px] text-muted" aria-live="polite">
      {data.status === 'ready' ? t('places.count', { count: visible.length }) : null}
    </p>
  );

  const resultBody = (layout: 'row' | 'column') => {
    if (data.status === 'needs-location')
      return (
        <EmptyState
          icon={MapPinned}
          title={t('location.chooseTitle')}
          text={t('location.chooseText')}
          action={<LocateButton />}
        />
      );
    if (data.status === 'loading')
      return <p className="px-1 py-6 text-sm text-muted">{t('places.loading')}</p>;
    if (data.status === 'unavailable')
      return (
        <EmptyState
          icon={DatabaseZap}
          title={t('places.unavailableTitle')}
          text={t('places.unavailableText')}
        />
      );
    if (data.status === 'error')
      return (
        <EmptyState
          icon={AlertTriangle}
          title={t('places.errorTitle')}
          text={t('places.errorText')}
        />
      );
    if (visible.length === 0)
      return (
        <EmptyState
          icon={SearchX}
          title={t('places.noResults')}
          action={
            <button
              type="button"
              onClick={filters.reset}
              className="rounded-control bg-surface px-4 py-2 text-sm font-medium hover:bg-[#2d3530]"
            >
              {t('places.resetFilters')}
            </button>
          }
        />
      );
    return (
      <div
        ref={listRef}
        className={cn(
          layout === 'row'
            ? 'no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto pt-1 pb-2'
            : 'flex flex-col gap-3',
        )}
      >
        {visible.map((place, i) => (
          <PlaceCard
            key={place.id}
            place={place}
            selected={place.id === selectedId}
            onSelect={select}
            className={cn(
              'animate-rise',
              layout === 'row' &&
                'w-[272px] shrink-0 snap-start xl:w-[calc((100%-2rem)/3)] xl:min-w-[232px]',
            )}
            style={{ animationDelay: `${Math.min(i, 6) * 40}ms` }}
          />
        ))}
      </div>
    );
  };

  if (!isTabletUp) {
    return (
      <div>
        <div className="fixed inset-x-0 top-[calc(56px+var(--banner-offset))] bottom-[calc(64px+128px+env(safe-area-inset-bottom))]">
          <LazyMapView
            {...mapProps}
            onSelect={(id) => {
              select(id);
              setSheetExpanded(false);
            }}
            className="h-full w-full"
            controlsClassName="top-[68px]"
          />
          {showSearchArea && (
            <div className="absolute inset-x-0 top-[64px] z-10 flex justify-center">
              <SearchAreaButton onClick={searchHere} />
            </div>
          )}
          <div className="absolute inset-x-0 top-0 z-10 bg-gradient-to-b from-bg/85 to-transparent px-4 pt-3 pb-6">
            <CategoryFilters
              available={availableCategories}
              selected={activeCategories}
              onChange={filters.setCategories}
            />
          </div>
        </div>
        <BottomSheet
          expanded={sheetExpanded}
          onExpandedChange={setSheetExpanded}
          header={
            <div className="flex items-center justify-between gap-3">
              {locationHeader}
              <div className="flex shrink-0 items-center gap-2">
                {data.isDemo && <DemoBadge />}
                {headerAction}
              </div>
            </div>
          }
        >
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            {countLabel}
            <div className="flex flex-wrap items-center gap-2">
              <LocateButton />
              <RadiusSelect />
            </div>
          </div>
          <GeolocationNotice className="mb-3" />
          <ProviderFailureNotice className="mb-3" />
          {resultBody('column')}
        </BottomSheet>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <Card className="p-5 xl:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          {locationHeader}
          <div className="flex flex-wrap items-center gap-3">
            {countLabel}
            <LocateButton />
            <RadiusSelect />
            {headerAction}
          </div>
        </div>
        <GeolocationNotice className="mb-4" />
        <ProviderFailureNotice className="mb-4" />
        <CategoryFilters
          className="mb-4"
          available={availableCategories}
          selected={activeCategories}
          onChange={filters.setCategories}
        />
        <div className="relative">
          <LazyMapView
            {...mapProps}
            onSelect={select}
            className="h-[420px] rounded-[12px] xl:h-[clamp(340px,46vh,520px)]"
          />
          {showSearchArea && (
            <div className="absolute inset-x-0 top-3 z-10 flex justify-center">
              <SearchAreaButton onClick={searchHere} />
            </div>
          )}
        </div>
      </Card>
      <section aria-labelledby="nearby-title">
        <h2 id="nearby-title" className="sr-only">
          {t('places.nearby')}
        </h2>
        {resultBody('row')}
      </section>
    </div>
  );
}
