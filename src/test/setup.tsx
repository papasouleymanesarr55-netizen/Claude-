import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';
import { __resetFavorites } from '@/features/favorites/useFavorites';
import '@/i18n';

// MapLibre nécessite WebGL, absent de jsdom : la carte est remplacée par un substitut.
vi.mock('@/features/map/LazyMapView', () => ({
  LazyMapView: ({ places }: { places: { id: string }[] }) => (
    <div data-testid="map" data-count={places.length} />
  ),
}));

// Aucun appel réseau réel en test : chaque test qui en a besoin fournit sa propre réponse.
beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.reject(new TypeError('Réseau désactivé en test'))),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  cleanup();
  __resetFavorites();
});
