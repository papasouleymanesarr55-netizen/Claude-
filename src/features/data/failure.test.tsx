import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { createDemoPlacesProvider } from '@/adapters/places/demo';
import { ProviderError, type PlacesProvider } from '@/core/providers/types';
import { demoSource } from '@/features/demo/demoSource';
import { renderApp } from '@/test/render';

const failing: PlacesProvider = {
  info: {
    id: 'en-panne',
    name: 'Source en panne',
    producer: 'Test',
    licence: 'Test',
    licenceUrl: null,
    url: null,
    updateFrequency: null,
    isDemo: false,
  },
  categories: ['fuel'],
  cacheTtlMs: 0,
  nearby: () => Promise.reject(new ProviderError('en-panne', 'network', 'down')),
};

describe('source en échec', () => {
  it('signale la panne et n’affiche aucune donnée de remplacement', async () => {
    renderApp('/?cat=fuel', async () => ({
      places: [failing, createDemoPlacesProvider(['parking'])],
      geocoding: null,
      categories: ['fuel', 'parking'],
      defaultLocation: demoSource.location,
      vehicles: [],
    }));
    expect(
      await screen.findByText(
        /Source momentanément indisponible : Source en panne/,
        {},
        { timeout: 4000 },
      ),
    ).toBeInTheDocument();
    expect(screen.queryByRole('article')).not.toBeInTheDocument();
  });
});
