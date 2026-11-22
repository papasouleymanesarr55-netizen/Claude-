import { PlacesView } from '@/features/places/PlacesView';
import type { CategoryId } from '@/features/places/types';

const SERVICES: CategoryId[] = ['fuel', 'garage', 'wash', 'tyres'];
const CHARGING: CategoryId[] = ['charging'];
const PARKING: CategoryId[] = ['parking'];

export function ExplorerPage() {
  return <PlacesView />;
}

export function ChargingPage() {
  return <PlacesView scope={CHARGING} />;
}

export function ParkingPage() {
  return <PlacesView scope={PARKING} />;
}

export function ServicesPage() {
  return <PlacesView scope={SERVICES} />;
}
