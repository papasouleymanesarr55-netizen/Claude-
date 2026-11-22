import type { PlacesProvider } from '@/core/providers/types';
import { demoSource } from '@/features/demo/demoSource';
import type { CategoryId } from '@/features/places/types';
import { distanceMeters } from '@/lib/geo';

/**
 * Adaptateur des données de démonstration (fictives).
 * Chargé uniquement si __DEMO_DATA__ est vrai : absent des builds de production.
 */
export function createDemoPlacesProvider(categories: CategoryId[]): PlacesProvider {
  return {
    info: {
      id: 'demo',
      name: 'Données de démonstration',
      producer: 'Projet (fictif)',
      licence: 'Données fictives',
      licenceUrl: null,
      url: null,
      updateFrequency: null,
      isDemo: true,
    },
    categories,
    cacheTtlMs: Infinity,
    async nearby({ center, radiusM }) {
      const places = await demoSource.listPlaces();
      return places.filter(
        (p) => categories.includes(p.category) && distanceMeters(center, p.position) <= radiusM,
      );
    },
  };
}
