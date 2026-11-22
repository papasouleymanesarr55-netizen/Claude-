import type { LatLng } from '@/lib/geo';
import type { Place } from '@/features/places/types';
import type { Vehicle } from '@/features/vehicles/types';

export interface ReferenceLocation {
  label: string;
  position: LatLng;
  isDemo: boolean;
}

/** Contrat d'accès aux données. La démo l'implémente aujourd'hui, Supabase demain. */
export interface DataSource {
  kind: 'demo';
  location: ReferenceLocation;
  listPlaces(): Promise<Place[]>;
  listVehicles(): Promise<Vehicle[]>;
}
