import { ChevronRight, EvCharger, Fuel, Heart, SquareParking, Wrench } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router';
import { DemoBadge } from '@/components/ui/Badge';
import { Card, CardTitle } from '@/components/ui/Card';
import { useData } from '@/features/data/DataProvider';
import { useFavorites } from '@/features/favorites/useFavorites';
import { categories, getCategory } from '@/features/places/categories';
import type { CategoryId } from '@/features/places/types';
import { VehicleCard } from '@/features/vehicles/VehicleCard';
import { formatDistance } from '@/lib/format';

const NEARBY_RADIUS_KM = 3;

/** Panneau d'informations à droite du dashboard (ou dans un tiroir sur tablette/mobile). */
export function RightPanel({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useTranslation();
  const data = useData();
  const navigate = useNavigate();
  const { ids: favoriteIds } = useFavorites();

  const showCategory = (cat: CategoryId) => {
    navigate(`/?cat=${cat}`);
    onNavigate?.();
  };

  const nearestCharger = useMemo(
    () =>
      data.places
        .filter((p) => p.category === 'charging' && p.distanceM != null)
        .sort((a, b) => (a.distanceM ?? 0) - (b.distanceM ?? 0))[0],
    [data.places],
  );

  const nearbyCounts = useMemo(() => {
    const within = data.places.filter(
      (p) => p.distanceM != null && p.distanceM <= NEARBY_RADIUS_KM * 1000,
    );
    return categories
      .map((c) => ({ ...c, count: within.filter((p) => p.category === c.id).length }))
      .filter((c) => c.count > 0);
  }, [data.places]);
  const maxCount = Math.max(1, ...nearbyCounts.map((c) => c.count));

  const recentFavorites = favoriteIds
    .map((id) => data.places.find((p) => p.id === id))
    .filter((p) => p != null)
    .slice(0, 3);

  const shortcuts: { cat: CategoryId; label: string; icon: typeof Fuel }[] = [
    { cat: 'charging', label: t('panel.shortcutCharging'), icon: EvCharger },
    { cat: 'fuel', label: t('panel.shortcutFuel'), icon: Fuel },
    { cat: 'parking', label: t('panel.shortcutParking'), icon: SquareParking },
    { cat: 'garage', label: t('panel.shortcutGarage'), icon: Wrench },
  ];

  const nearestDistance =
    nearestCharger?.distanceM != null ? formatDistance(nearestCharger.distanceM) : null;

  return (
    <div className="flex flex-col gap-4">
      <VehicleCard vehicle={data.vehicles[0] ?? null} />

      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4">
          <CardTitle className="text-[13px] text-muted">{t('panel.shortcuts')}</CardTitle>
          <ul className="mt-3 flex flex-col gap-1">
            {shortcuts.map(({ cat, label, icon: Icon }) => (
              <li key={cat}>
                <button
                  type="button"
                  onClick={() => showCategory(cat)}
                  className="group flex w-full items-center gap-2.5 rounded-lg px-1.5 py-1.5 text-left text-[13px] transition-colors hover:bg-surface"
                >
                  <Icon aria-hidden className="size-4 text-accent" strokeWidth={1.9} />
                  <span className="leading-tight">{label}</span>
                </button>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="flex flex-col p-4">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-[13px] text-muted">{t('panel.nearestCharger')}</CardTitle>
          </div>
          {nearestCharger && nearestDistance ? (
            <>
              <p className="mt-2 line-clamp-2 text-[14px] leading-snug font-medium">
                {nearestCharger.name}
              </p>
              <p className="mt-auto pt-3 text-[26px] leading-none font-medium tracking-tight tabular-nums">
                {nearestDistance.value}
                <span className="ml-1 text-[16px] font-normal text-muted">
                  {nearestDistance.unit}
                </span>
              </p>
              <button
                type="button"
                onClick={() => {
                  navigate(`/?place=${encodeURIComponent(nearestCharger.id)}`);
                  onNavigate?.();
                }}
                className="mt-3 inline-flex items-center gap-1 text-[12.5px] font-medium text-accent hover:underline"
              >
                {t('panel.showOnMap')}
                <ChevronRight aria-hidden className="size-3.5" />
              </button>
              {nearestCharger.source.isDemo && <DemoBadge className="mt-2 self-start" />}
            </>
          ) : (
            <p className="mt-2 text-[13px] text-muted">{t('places.notProvided')}</p>
          )}
        </Card>
      </div>

      <Card className="p-5">
        <div className="flex items-baseline justify-between">
          <CardTitle>{t('panel.nearbyServices')}</CardTitle>
          <span className="text-[11px] text-muted">
            {t('panel.withinRadius', { km: NEARBY_RADIUS_KM })}
          </span>
        </div>
        {nearbyCounts.length > 0 ? (
          <ul className="mt-4 flex flex-col gap-3">
            {nearbyCounts.map(({ id, icon: Icon, count }) => (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => showCategory(id)}
                  className="group grid w-full grid-cols-[18px_88px_1fr_20px] items-center gap-2.5 text-left"
                >
                  <Icon
                    aria-hidden
                    className="size-4 text-muted group-hover:text-accent"
                    strokeWidth={1.9}
                  />
                  <span className="truncate text-[13px]">{t(`categories.${id}`)}</span>
                  <span className="h-1.5 overflow-hidden rounded-full bg-surface">
                    <span
                      className="block h-full rounded-full bg-accent transition-[width] duration-500 ease-out-soft"
                      style={{ width: `${(count / maxCount) * 100}%` }}
                    />
                  </span>
                  <span className="text-right text-[13px] font-medium tabular-nums">{count}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-[13px] text-muted">{t('places.notProvided')}</p>
        )}
      </Card>

      <Card className="p-5">
        <CardTitle>{t('panel.recentFavorites')}</CardTitle>
        {recentFavorites.length > 0 ? (
          <ul className="mt-3 flex flex-col">
            {recentFavorites.map((p) => {
              const Icon = getCategory(p.category).icon;
              const dist = p.distanceM != null ? formatDistance(p.distanceM) : null;
              return (
                <li key={p.id}>
                  <Link
                    to={`/?place=${encodeURIComponent(p.id)}`}
                    onClick={onNavigate}
                    className="flex items-center gap-3 rounded-lg px-1 py-2 transition-colors hover:bg-surface"
                  >
                    <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-surface text-accent">
                      <Icon aria-hidden className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[13px]">{p.name}</span>
                    {dist && (
                      <span className="text-[12px] text-muted tabular-nums">
                        {dist.value} {dist.unit}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="mt-3 flex items-start gap-3 rounded-control bg-surface/50 p-3">
            <Heart aria-hidden className="mt-0.5 size-4 shrink-0 text-muted" />
            <div>
              <p className="text-[13px]">{t('panel.noFavorites')}</p>
              <p className="mt-0.5 text-[12px] text-muted">{t('panel.noFavoritesText')}</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
