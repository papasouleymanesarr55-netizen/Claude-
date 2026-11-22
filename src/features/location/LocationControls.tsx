import { AlertCircle, LocateFixed, RotateCw, ScanSearch } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useData } from '@/features/data/DataProvider';
import { cn } from '@/lib/cn';
import { RADIUS_OPTIONS_KM } from './area';

/** Bouton « Ma position » : ne déclenche la demande d'autorisation qu'au clic. */
export function LocateButton({ className }: { className?: string }) {
  const { t } = useTranslation();
  const { geolocation, requestGeolocation, location } = useData();
  const pending = geolocation.status === 'pending';
  const active = location?.source === 'device';
  return (
    <button
      type="button"
      onClick={requestGeolocation}
      disabled={pending}
      aria-busy={pending}
      className={cn(
        'inline-flex h-9 shrink-0 items-center gap-2 rounded-full border px-3.5 text-[13px] font-medium transition-colors',
        active
          ? 'border-accent/40 bg-accent/12 text-accent'
          : 'border-border bg-surface/60 text-text hover:border-[#3a443e]',
        pending && 'cursor-wait opacity-80',
        className,
      )}
    >
      <LocateFixed aria-hidden className={cn('size-4', pending && 'animate-pulse')} />
      {pending ? t('location.locating') : active ? t('location.update') : t('location.useMine')}
    </button>
  );
}

/** Choix du rayon de recherche. */
export function RadiusSelect({ className }: { className?: string }) {
  const { t } = useTranslation();
  const { area, setRadius } = useData();
  if (!area) return null;
  return (
    <div
      role="radiogroup"
      aria-label={t('location.radius')}
      className={cn(
        'inline-flex shrink-0 rounded-full border border-border bg-surface/60 p-0.5',
        className,
      )}
    >
      {RADIUS_OPTIONS_KM.map((km) => {
        const checked = area.radiusM === km * 1000;
        return (
          <button
            key={km}
            type="button"
            role="radio"
            aria-checked={checked}
            onClick={() => setRadius(km * 1000)}
            className={cn(
              'h-8 rounded-full px-2.5 text-[12.5px] font-medium tabular-nums transition-colors',
              checked ? 'bg-accent/15 text-accent' : 'text-muted hover:text-text',
            )}
          >
            {km} km
          </button>
        );
      })}
    </div>
  );
}

/** Bouton affiché sur la carte après un déplacement de l'utilisateur. */
export function SearchAreaButton({
  onClick,
  className,
}: {
  onClick: () => void;
  className?: string;
}) {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'animate-rise inline-flex h-9 items-center gap-2 rounded-full bg-accent px-4 text-[13px] font-semibold text-bg shadow-[0_6px_20px_-6px_rgba(0,0,0,0.6)] hover:bg-[#5febbb]',
        className,
      )}
    >
      <ScanSearch aria-hidden className="size-4" />
      {t('location.searchArea')}
    </button>
  );
}

/** Message d'erreur de géolocalisation, avec la marche à suivre. */
export function GeolocationNotice({ className }: { className?: string }) {
  const { t } = useTranslation();
  const { geolocation, requestGeolocation } = useData();
  if (geolocation.status !== 'error' || !geolocation.error) return null;
  const canRetry = geolocation.error === 'timeout' || geolocation.error === 'unavailable';
  return (
    <div
      role="alert"
      className={cn(
        'flex items-start gap-3 rounded-control border border-[#e5a148]/25 bg-[#e5a148]/[0.07] p-3 text-[13px]',
        className,
      )}
    >
      <AlertCircle aria-hidden className="mt-0.5 size-4 shrink-0 text-[#e5a148]" />
      <div className="min-w-0 flex-1">
        <p className="font-medium">{t(`location.errors.${geolocation.error}.title`)}</p>
        <p className="mt-0.5 text-muted">{t(`location.errors.${geolocation.error}.text`)}</p>
      </div>
      {canRetry && (
        <button
          type="button"
          onClick={requestGeolocation}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-1 text-[12.5px] font-medium text-accent hover:bg-accent/10"
        >
          <RotateCw aria-hidden className="size-3.5" />
          {t('location.retry')}
        </button>
      )}
    </div>
  );
}

/** Avertissement quand une source est momentanément indisponible : ses données sont absentes. */
export function ProviderFailureNotice({ className }: { className?: string }) {
  const { t } = useTranslation();
  const { failedProviders, status, retry } = useData();
  if (failedProviders.length === 0 || status === 'error') return null;
  return (
    <div
      role="status"
      className={cn(
        'flex items-center gap-3 rounded-control border border-border bg-surface/50 px-3 py-2 text-[12.5px] text-muted',
        className,
      )}
    >
      <AlertCircle aria-hidden className="size-4 shrink-0 text-[#e5a148]" />
      <span className="min-w-0 flex-1">
        {t('places.partialFailure', { sources: failedProviders.map((p) => p.name).join(', ') })}
      </span>
      <button
        type="button"
        onClick={retry}
        className="shrink-0 font-medium text-accent hover:underline"
      >
        {t('location.retry')}
      </button>
    </div>
  );
}
