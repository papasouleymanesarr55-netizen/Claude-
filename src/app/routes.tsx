import type { RouteObject } from 'react-router';
import { AppShell } from '@/layouts/AppShell';
import type { RouteHandle } from '@/layouts/TopBar';
import { ChargingPage, ExplorerPage, ParkingPage, ServicesPage } from '@/pages/CategoryPages';
import { ComingSoonPage } from '@/pages/ComingSoonPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { FavoritesPage } from '@/pages/FavoritesPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { VehiclesPage } from '@/pages/VehiclesPage';

const h = (titleKey: string, searchable = false, vehiclePanel = false): RouteHandle => ({
  titleKey,
  searchable,
  vehiclePanel,
});

export const routes: RouteObject[] = [
  {
    element: <AppShell />,
    children: [
      { index: true, element: <DashboardPage />, handle: h('pages.dashboard', true, true) },
      { path: 'explorer', element: <ExplorerPage />, handle: h('pages.explorer', true) },
      { path: 'recharge', element: <ChargingPage />, handle: h('pages.charging', true) },
      { path: 'parkings', element: <ParkingPage />, handle: h('pages.parking', true) },
      { path: 'services', element: <ServicesPage />, handle: h('pages.services', true) },
      { path: 'favoris', element: <FavoritesPage />, handle: h('pages.favorites') },
      { path: 'vehicules', element: <VehiclesPage />, handle: h('pages.vehicles') },
      {
        path: 'compte',
        element: <ComingSoonPage messageKey="comingSoon.account" />,
        handle: h('pages.account'),
      },
      {
        path: 'abonnement',
        element: <ComingSoonPage messageKey="comingSoon.subscription" />,
        handle: h('pages.subscription'),
      },
      { path: '*', element: <NotFoundPage />, handle: h('pages.notFound') },
    ],
  },
];
