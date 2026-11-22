import { CarFront, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { DemoBadge } from '@/components/ui/Badge';
import { Card, CardTitle } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import type { Vehicle } from './types';
import { VehicleSilhouette } from './VehicleSilhouette';

function Stat({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="min-w-0">
      <dt className="truncate text-[11px] text-muted">{label}</dt>
      <dd className="mt-1 truncate text-[17px] font-medium tracking-tight tabular-nums">
        {value}
        {unit && <span className="ml-1 text-[13px] font-normal text-muted">{unit}</span>}
      </dd>
    </div>
  );
}

export function VehicleCard({
  vehicle,
  showManageLink = true,
}: {
  vehicle: Vehicle | null;
  showManageLink?: boolean;
}) {
  const { t } = useTranslation();

  if (!vehicle) {
    return (
      <Card className="p-5">
        <CardTitle>{t('vehicle.title')}</CardTitle>
        <EmptyState
          icon={CarFront}
          title={t('vehicle.none')}
          text={t('vehicle.noneText')}
          className="py-6"
        />
      </Card>
    );
  }

  const isElectric = vehicle.energy === 'electric' || vehicle.energy === 'hybrid';
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <CardTitle>{t('vehicle.title')}</CardTitle>
        {vehicle.isDemo && <DemoBadge />}
      </div>
      <div className="relative mt-3 mb-1">
        <div
          aria-hidden
          className="absolute inset-x-8 bottom-1 h-10 rounded-full bg-accent/10 blur-2xl"
        />
        <VehicleSilhouette className="relative mx-auto w-full max-w-[300px]" />
      </div>
      <p className="text-[17px] font-medium tracking-tight">{vehicle.name}</p>
      <p className="text-[13px] text-muted">{vehicle.model}</p>
      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-4">
        <Stat label={t('vehicle.energy')} value={t(`vehicle.energies.${vehicle.energy}`)} />
        <Stat
          label={t('vehicle.range')}
          value={vehicle.rangeKm != null ? String(vehicle.rangeKm) : '—'}
          {...(vehicle.rangeKm != null ? { unit: 'km' } : {})}
        />
        {isElectric && <Stat label={t('vehicle.connector')} value={vehicle.connector ?? '—'} />}
        {isElectric && (
          <Stat
            label={t('vehicle.maxCharge')}
            value={vehicle.maxChargeKw != null ? String(vehicle.maxChargeKw) : '—'}
            {...(vehicle.maxChargeKw != null ? { unit: 'kW' } : {})}
          />
        )}
      </dl>
      <p className="mt-3 text-[11px] text-muted/80">{t('vehicle.rangeHint')}</p>
      {showManageLink && (
        <Link
          to="/vehicules"
          className="mt-4 flex items-center justify-between rounded-control bg-surface/70 px-3.5 py-2.5 text-[13px] text-muted transition-colors hover:text-text"
        >
          {t('vehicle.manage')}
          <ChevronRight aria-hidden className="size-4" />
        </Link>
      )}
    </Card>
  );
}
