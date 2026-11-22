import type { LatLng } from '@/lib/geo';

export type CategoryId = 'charging' | 'fuel' | 'parking' | 'garage' | 'wash' | 'tyres';

export interface PlaceDetail {
  label: string;
  value: string;
  unit: string | null;
}

export interface PlacePrice {
  amount: number;
  /** Unité après « € / » : kWh, L, h… Chaîne vide pour un prix forfaitaire. */
  unit: string;
}

export interface PlaceSource {
  name: string;
  isDemo: boolean;
  /** Date ISO de dernière mise à jour, null si inconnue. */
  updatedAt: string | null;
}

export interface Place {
  id: string;
  name: string;
  category: CategoryId;
  position: LatLng;
  address: string;
  price: PlacePrice | null;
  services: string[];
  /** Deux caractéristiques clés affichées sur la carte (type, puissance, places…). */
  details: PlaceDetail[];
  openingHours: string | null;
  source: PlaceSource;
}

export interface PlaceWithDistance extends Place {
  /** Distance depuis la position de référence, null si la position est inconnue. */
  distanceM: number | null;
}
