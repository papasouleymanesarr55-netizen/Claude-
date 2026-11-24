import type { CategoryId } from '@/features/places/types';
import type { ReferenceLocation } from '@/features/data/types';
import type { Vehicle } from '@/features/vehicles/types';
import { geoplateformeGeocoder } from '@/adapters/geocoding/geoplateforme';
import { fuelGouvProvider } from '@/adapters/places/fuel-gouv';
import { irveStaticProvider } from '@/adapters/places/irve-static';
import type { GeocodingProvider, PlacesProvider } from './types';

export interface ProviderSetup {
  places: PlacesProvider[];
  /** Recherche d'adresse et nom du lieu d'une position (null : recherche d'adresse indisponible). */
  geocoding: GeocodingProvider | null;
  /** Catégories couvertes par au moins un fournisseur (les autres sont masquées). */
  categories: CategoryId[];
  /** Position de départ quand l'utilisateur n'a pas encore choisi (démo uniquement). */
  defaultLocation: ReferenceLocation | null;
  vehicles: Vehicle[];
}

/**
 * Point unique de configuration des fournisseurs.
 * Les sources réelles (carburants, bornes) seront ajoutées ici, catégorie par catégorie.
 * `__DEMO_DATA__` est une constante de compilation : en production, le module de démonstration
 * est éliminé du bundle (voir build/demo-guard.ts).
 */
export async function loadProviders(): Promise<ProviderSetup> {
  // Sources réelles, actives dans tous les builds.
  const places: PlacesProvider[] = [fuelGouvProvider, irveStaticProvider];
  let defaultLocation: ReferenceLocation | null = null;
  let vehicles: Vehicle[] = [];

  if (__DEMO_DATA__) {
    const [{ createDemoPlacesProvider }, { demoSource }] = await Promise.all([
      import('@/adapters/places/demo'),
      import('@/features/demo/demoSource'),
    ]);
    const covered = new Set(places.flatMap((p) => p.categories));
    const demoCategories = (
      ['charging', 'fuel', 'parking', 'garage', 'wash', 'tyres'] as CategoryId[]
    ).filter((c) => !covered.has(c));
    if (demoCategories.length > 0) places.push(createDemoPlacesProvider(demoCategories));
    defaultLocation = demoSource.location;
    vehicles = await demoSource.listVehicles();
  }

  return {
    places,
    geocoding: geoplateformeGeocoder,
    categories: [...new Set(places.flatMap((p) => p.categories))],
    defaultLocation,
    vehicles,
  };
}
