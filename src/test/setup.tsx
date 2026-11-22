import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';
import { __resetFavorites } from '@/features/favorites/useFavorites';
import '@/i18n';

// MapLibre nécessite WebGL, absent de jsdom : la carte est remplacée par un substitut.
vi.mock('@/features/map/LazyMapView', () => ({
  LazyMapView: ({ places }: { places: { id: string }[] }) => (
    <div data-testid="map" data-count={places.length} />
  ),
}));

afterEach(() => {
  cleanup();
  __resetFavorites();
});
