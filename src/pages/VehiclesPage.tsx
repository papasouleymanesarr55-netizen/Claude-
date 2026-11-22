import { Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/Card';
import { useData } from '@/features/data/DataProvider';
import { VehicleCard } from '@/features/vehicles/VehicleCard';

export function VehiclesPage() {
  const { t } = useTranslation();
  const { vehicles } = useData();
  return (
    <div className="mt-2 grid items-start gap-4 lg:grid-cols-[minmax(0,420px)_1fr]">
      <VehicleCard vehicle={vehicles[0] ?? null} showManageLink={false} />
      <Card className="flex items-start gap-3 p-5">
        <Clock aria-hidden className="mt-0.5 size-5 shrink-0 text-accent" />
        <div>
          <p className="text-[15px] font-medium">{t('comingSoon.title')}</p>
          <p className="mt-1 text-sm text-muted">{t('comingSoon.vehicles')}</p>
        </div>
      </Card>
    </div>
  );
}
