import type { LatLng } from '@/lib/geo';
import type { Place } from '@/features/places/types';
import type { Vehicle } from '@/features/vehicles/types';

/** Origine de la position de référence. */
export type LocationSource = 'demo' | 'device' | 'search';

export interface ReferenceLocation {
  /** Nom du lieu, null si inconnu (ex. position GPS avant géocodage inverse). */
  label: string | null;
  /** Complément (code postal, commune…). */
  context?: string | null;
  position: LatLng;
  isDemo: boolean;
  source?: LocationSource;
  /** Précision de la géolocalisation, en mètres. */
  accuracyM?: number | null;
}

/** Jeu de démonstration (fictif) : utilisé uniquement par l'adaptateur de démo. */
export interface DataSource {
  kind: 'demo';
  location: ReferenceLocation;
  listPlaces(): Promise<Place[]>;
  listVehicles(): Promise<Vehicle[]>;
}
