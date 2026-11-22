import { useTranslation } from 'react-i18next';
import { Drawer } from '@/components/ui/Drawer';
import { PlacesView } from '@/features/places/PlacesView';
import { RightPanel } from '@/layouts/RightPanel';
import { useShellState } from '@/layouts/shellState';
import { MQ_DESKTOP_UP, useMediaQuery } from '@/lib/useMediaQuery';

export function DashboardPage() {
  const { t } = useTranslation();
  const isDesktop = useMediaQuery(MQ_DESKTOP_UP);
  const { vehiclePanelOpen, setVehiclePanelOpen } = useShellState();

  if (isDesktop) {
    return (
      <div className="grid grid-cols-[minmax(0,1fr)_340px] items-start gap-6 2xl:grid-cols-[minmax(0,1fr)_380px]">
        <PlacesView />
        <aside aria-label={t('vehicle.title')}>
          <RightPanel />
        </aside>
      </div>
    );
  }

  const close = () => setVehiclePanelOpen(false);
  return (
    <>
      <PlacesView />
      <Drawer
        open={vehiclePanelOpen}
        onClose={close}
        title={t('panel.drawerTitle')}
        closeLabel={t('panel.close')}
      >
        <RightPanel onNavigate={close} />
      </Drawer>
    </>
  );
}
