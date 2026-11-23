import type { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { DemoBadge } from '@/components/ui/Badge';
import { cn } from '@/lib/cn';
import { formatDistance, formatPrice } from '@/lib/format';
import { getCategory } from './categories';
import { DirectionsButton } from './DirectionsButton';
import { FavoriteButton } from './FavoriteButton';
import type { PlaceWithDistance } from './types';

interface PlaceCardProps {
  place: PlaceWithDistance;
  selected?: boolean;
  onSelect?: (id: string) => void;
  className?: string;
  style?: CSSProperties;
}

function Stat({
  label,
  value,
  unit,
  hint,
  tone,
}: {
  label: string;
  value: string;
  unit?: string | null;
  hint?: string | undefined;
  tone?: 'warning' | undefined;
}) {
  return (
    <div className="min-w-0">
      <dt className="truncate text-[11px] text-muted">{label}</dt>
      <dd
        title={hint}
        className={cn(
          'mt-0.5 truncate text-[15px] font-medium tabular-nums',
          tone === 'warning' && 'text-[#e5a148]',
        )}
      >
        {hint && <span className="sr-only">{hint}</span>}
        <span aria-hidden={hint ? true : undefined}>{value}</span>
        {unit && <span className="ml-0.5 text-[12px] font-normal text-muted">{unit}</span>}
      </dd>
    </div>
  );
}

export function PlaceCard({ place, selected = false, onSelect, className, style }: PlaceCardProps) {
  const { t } = useTranslation();
  const Icon = getCategory(place.category).icon;
  const distance = place.distanceM != null ? formatDistance(place.distanceM) : null;
  const price = place.price
    ? formatPrice(place.price.amount, place.price.unit, place.price.decimals)
    : null;
  const priceLabel = place.source.isDemo ? t('demo.priceLabel') : t('places.price');
  const [first, second] = place.details;

  return (
    <article
      aria-current={selected ? 'true' : undefined}
      data-place-id={place.id}
      style={style}
      className={cn(
        'group relative flex cursor-pointer flex-col rounded-card border bg-card p-5 transition-[border-color,background-color,transform] duration-200 ease-out-soft',
        selected
          ? 'border-accent/80 shadow-[0_0_0_1px_rgba(72,229,173,0.25),0_8px_30px_-12px_rgba(72,229,173,0.35)]'
          : 'border-white/[0.04] hover:-translate-y-0.5 hover:border-border',
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <span className="grid size-11 place-items-center rounded-xl border border-accent/30 bg-accent/8 text-accent">
          <Icon aria-hidden className="size-[22px]" strokeWidth={1.8} />
        </span>
        <div className="relative z-10 flex items-center gap-1">
          {place.source.isDemo && <DemoBadge />}
          <FavoriteButton placeId={place.id} />
        </div>
      </div>

      <div className="mt-5 flex items-end justify-between gap-3">
        <p className="text-[26px] leading-none font-medium tracking-tight tabular-nums">
          {distance ? (
            <>
              {distance.value}
              <span className="ml-1.5 text-[18px] font-normal text-muted">{distance.unit}</span>
            </>
          ) : (
            <span className="text-[15px] text-muted">{t('places.positionUnknown')}</span>
          )}
        </p>
        <DirectionsButton place={place} selected={selected} />
      </div>

      <h3 className="mt-3 truncate text-[16px] font-medium">
        <button
          type="button"
          className="truncate text-left outline-none after:absolute after:inset-0 after:rounded-card focus-visible:after:outline-2 focus-visible:after:outline-accent"
          onClick={(e) => {
            e.stopPropagation();
            onSelect?.(place.id);
          }}
        >
          {place.name}
        </button>
      </h3>
      <p className="mt-0.5 truncate text-[12.5px] text-muted">
        {t(`categories.${place.category}`)}
        {place.services.length > 0 && ` · ${place.services.slice(0, 3).join(' · ')}`}
      </p>

      <dl className="mt-4 flex justify-between gap-3 border-t border-white/[0.05] pt-4">
        {first && <Stat {...first} />}
        {price ? (
          <Stat label={priceLabel} value={price.value} unit={price.unit} />
        ) : (
          <div className="min-w-0">
            <dt className="truncate text-[11px] text-muted">{priceLabel}</dt>
            <dd className="mt-1 truncate text-[12.5px] text-muted">{t('places.notProvided')}</dd>
          </div>
        )}
        {second && <Stat {...second} />}
      </dl>
    </article>
  );
}
